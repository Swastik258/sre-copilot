"""Deterministic Kubernetes diagnosis rules.

Given a read-only view of a pod (status, container states, events and bounded
logs), this module produces a structured :class:`Diagnosis` plus the
:class:`Evidence` that supports it. Everything here is deterministic — no LLM is
involved — so results are reproducible and testable. ``model_generated`` is
therefore always ``False``.

The rules separate **confirmed observations** (facts read from the cluster) from
**hypotheses** (interpretations). A hypothesis always cites the evidence that
supports it and carries an explicit confidence.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from app.adapters.kubernetes.client import KubernetesReadClient
from app.adapters.kubernetes.models import (
    ClusterInfo,
    ContainerState,
    ContainerStatus,
    EventInfo,
    PodInfo,
    PodLogs,
)
from app.core.config import get_settings
from app.schemas.evidence import Evidence, EvidenceSource, Severity
from app.schemas.investigation import (
    Diagnosis,
    Hypothesis,
    RecommendedStep,
    Remediation,
    RiskLevel,
)
from app.services.evidence import build_evidence


class FindingKind(str, Enum):
    crash_loop = "crash_loop"
    oom_killed = "oom_killed"
    image_pull = "image_pull"
    unschedulable = "unschedulable"
    pending = "pending"
    probe_failure = "probe_failure"
    container_error = "container_error"
    connectivity = "connectivity"


@dataclass
class Finding:
    kind: FindingKind
    statement: str
    confidence: float
    severity: Severity
    evidence: list[Evidence] = field(default_factory=list)
    reasoning: str = ""
    steps: list[RecommendedStep] = field(default_factory=list)
    remediations: list[Remediation] = field(default_factory=list)


@dataclass
class PodDiagnosis:
    cluster: ClusterInfo
    pod: PodInfo
    diagnosis: Diagnosis
    evidence: list[Evidence]


# ---------------------------------------------------------------------------
# Evidence helpers
# ---------------------------------------------------------------------------


def _ev(**kwargs) -> Evidence:
    kwargs.setdefault("source_type", EvidenceSource.kubernetes)
    settings = get_settings()
    return build_evidence(redaction_enabled=settings.redaction_enabled, **kwargs)


def _readonly_step(action: str, purpose: str, expected: str) -> RecommendedStep:
    return RecommendedStep(
        action=action,
        purpose=purpose,
        expected_output=expected,
        changes_state=False,
        risk=RiskLevel.none,
    )


# ---------------------------------------------------------------------------
# Rule evaluation
# ---------------------------------------------------------------------------


def _eval_container(
    container: ContainerStatus, pod: PodInfo, demo: bool
) -> tuple[list[Finding], list[Evidence]]:
    findings: list[Finding] = []
    reasons = {r for r in (container.reason, container.last_reason) if r}

    status_ev = _ev(
        summary=(
            f"Container {container.name}: state={container.state.value}"
            f" reason={container.reason or 'none'} restarts={container.restart_count}"
            + (f" lastReason={container.last_reason}" if container.last_reason else "")
            + (f" lastExit={container.last_exit_code}" if container.last_exit_code is not None else "")
        ),
        source_resource=f"{pod.namespace}/{pod.name}/{container.name}",
        payload=container.model_dump(mode="json"),
        severity=Severity.high if (container.restart_count and container.restart_count > 0) else Severity.info,
        provenance="pod.status.containerStatuses",
        demo=demo,
    )
    evidence = [status_ev]

    if "OOMKilled" in reasons:
        findings.append(
            Finding(
                kind=FindingKind.oom_killed,
                statement=(
                    f"Container {container.name} was terminated for exceeding its memory limit "
                    "(OOMKilled)."
                ),
                confidence=0.9,
                severity=Severity.high,
                evidence=[status_ev],
                reasoning=(
                    f"The last termination reason is OOMKilled (exit code "
                    f"{container.last_exit_code}). This is reported by the kubelet, not inferred."
                ),
                steps=[
                    _readonly_step(
                        f"kubectl logs -n {pod.namespace} {pod.name} -c {container.name} --previous",
                        "Confirm the process was killed during memory allocation.",
                        "Log lines immediately before termination (may be empty).",
                    ),
                    _readonly_step(
                        f"kubectl get pod {pod.name} -n {pod.namespace} -o jsonpath='{{.spec.containers[*].resources}}'",
                        "Inspect the container's memory requests and limits.",
                        "Current requests/limits for the container.",
                    ),
                ],
                remediations=[
                    Remediation(
                        title=f"Raise or right-size the memory limit for {container.name}",
                        description=(
                            "Increase the container memory limit (and request) or reduce the "
                            "workload's peak memory. Do not guess: use observed usage first."
                        ),
                        changes_state=True,
                        risk=RiskLevel.medium,
                        preconditions=[
                            "Confirm OOMKilled is current, not historical.",
                            "Establish the normal and peak memory usage of the workload.",
                        ],
                        rollback="Revert the Deployment memory limit to its previous value.",
                        verification="Observe restart count stays flat and no new OOMKilled terminations.",
                    )
                ],
            )
        )

    if "CrashLoopBackOff" in reasons:
        findings.append(
            Finding(
                kind=FindingKind.crash_loop,
                statement=(
                    f"Container {container.name} is in CrashLoopBackOff after "
                    f"{container.restart_count} restarts."
                ),
                confidence=0.85,
                severity=Severity.high,
                evidence=[status_ev],
                reasoning=(
                    "The container repeatedly exits and the kubelet has entered back-off. "
                    "Confirm the exit reason from the container's last state and previous logs."
                ),
                steps=[
                    _readonly_step(
                        f"kubectl logs -n {pod.namespace} {pod.name} -c {container.name} --previous",
                        "Read the logs from the previous (crashed) run.",
                        "The error that caused the last exit.",
                    ),
                    _readonly_step(
                        f"kubectl describe pod {pod.name} -n {pod.namespace}",
                        "Inspect last state, exit code, and recent events.",
                        "Last State / Exit Code and warning events.",
                    ),
                ],
                remediations=[
                    Remediation(
                        title=f"Fix the startup failure in {container.name}",
                        description=(
                            "Address the underlying startup error shown in the previous logs. "
                            "Common causes: missing configuration/secret, dependency unreachable, "
                            "bad entrypoint."
                        ),
                        changes_state=True,
                        risk=RiskLevel.medium,
                        preconditions=["The root-cause error has been identified from evidence."],
                        rollback="Revert the Deployment/image change to the last known-good revision.",
                        verification="New pods reach Ready with a stable restart count.",
                    )
                ],
            )
        )

    if container.reason in {"ImagePullBackOff", "ErrImagePull"} or "pull" in (
        (container.message or "").lower()
    ):
        findings.append(
            Finding(
                kind=FindingKind.image_pull,
                statement=f"Container {container.name} cannot pull its image ({container.image}).",
                confidence=0.88,
                severity=Severity.high,
                evidence=[status_ev],
                reasoning=(
                    "The container is waiting because the image could not be pulled. Causes "
                    "include a wrong tag/digest, a private registry without imagePullSecrets, "
                    "or registry authentication failure."
                ),
                steps=[
                    _readonly_step(
                        f"kubectl describe pod {pod.name} -n {pod.namespace}",
                        "Read the exact pull error and registry host.",
                        "Failed / ErrImagePull event with the registry message.",
                    ),
                    _readonly_step(
                        f"kubectl get pod {pod.name} -n {pod.namespace} -o jsonpath='{{.spec.imagePullSecrets}}'",
                        "Check whether the required imagePullSecret is referenced.",
                        "The pod's imagePullSecrets list.",
                    ),
                ],
                remediations=[
                    Remediation(
                        title="Correct the image reference or registry credentials",
                        description=(
                            "Fix the tag/digest, or add the correct imagePullSecret. Do not "
                            "embed registry credentials in the workload spec in plain text."
                        ),
                        changes_state=True,
                        risk=RiskLevel.medium,
                        preconditions=["The failing image reference or missing secret is confirmed."],
                        rollback="Revert the workload spec to the previous revision.",
                        verification="The pod's image pulls successfully and the container starts.",
                    )
                ],
            )
        )

    if container.state == ContainerState.terminated and container.exit_code not in (0, None):
        findings.append(
            Finding(
                kind=FindingKind.container_error,
                statement=(
                    f"Container {container.name} terminated with exit code "
                    f"{container.exit_code} ({container.reason or 'unknown'})."
                ),
                confidence=0.7,
                severity=Severity.medium,
                evidence=[status_ev],
                reasoning="A non-zero exit code indicates the process failed or was signalled.",
                steps=[
                    _readonly_step(
                        f"kubectl logs -n {pod.namespace} {pod.name} -c {container.name}",
                        "Read the current container logs.",
                        "The error emitted before termination.",
                    )
                ],
            )
        )

    if not findings and container.restart_count and container.restart_count > 0:
        findings.append(
            Finding(
                kind=FindingKind.crash_loop,
                statement=(
                    f"Container {container.name} has restarted {container.restart_count} times."
                ),
                confidence=0.5,
                severity=Severity.medium,
                evidence=[status_ev],
                reasoning="Frequent restarts indicate instability even without an active back-off.",
                steps=[
                    _readonly_step(
                        f"kubectl describe pod {pod.name} -n {pod.namespace}",
                        "Check for recurring termination reasons.",
                        "Restart count trend and last state.",
                    )
                ],
            )
        )

    return findings, evidence


def _eval_pod_phase(
    pod: PodInfo, events: list[EventInfo], demo: bool
) -> tuple[list[Finding], list[Evidence]]:
    evidence: list[Evidence] = []
    findings: list[Finding] = []

    phase_ev = _ev(
        summary=(
            f"Pod {pod.namespace}/{pod.name} phase={pod.phase} node={pod.node_name or 'unassigned'}"
        ),
        source_resource=f"{pod.namespace}/{pod.name}",
        payload=pod.model_dump(mode="json"),
        severity=Severity.info,
        provenance="pod.status",
        demo=demo,
    )
    evidence.append(phase_ev)

    scheduling_events = [
        e for e in events if e.reason in {"FailedScheduling", "Unschedulable"}
    ]
    if pod.phase == "Pending":
        if scheduling_events:
            ev = _ev(
                summary=f"Scheduling failure: {scheduling_events[0].message}",
                source_resource=f"{pod.namespace}/{pod.name}",
                payload=[e.model_dump(mode="json") for e in scheduling_events],
                severity=Severity.high,
                provenance="events (FailedScheduling)",
                demo=demo,
            )
            evidence.append(ev)
            findings.append(
                Finding(
                    kind=FindingKind.unschedulable,
                    statement=(
                        f"Pod {pod.name} is Pending and cannot be scheduled: "
                        f"{scheduling_events[0].message}"
                    ),
                    confidence=0.85,
                    severity=Severity.high,
                    evidence=[phase_ev, ev],
                    reasoning=(
                        "The scheduler reported it could not place the pod on any node. This is "
                        "usually resource pressure or an unsatisfiable selector/affinity."
                    ),
                    steps=[
                        _readonly_step(
                            "kubectl describe node <node>",
                            "Check allocatable vs requested resources.",
                            "Allocated resources and taints.",
                        ),
                        _readonly_step(
                            f"kubectl get pod {pod.name} -n {pod.namespace} -o yaml",
                            "Check resource requests, nodeSelector and affinity.",
                            "The pod's scheduling constraints.",
                        ),
                    ],
                    remediations=[
                        Remediation(
                            title="Resolve the scheduling constraint",
                            description=(
                                "Free capacity, reduce requests, add nodes, or relax a selector/"
                                "affinity/taint that the pod cannot satisfy."
                            ),
                            changes_state=True,
                            risk=RiskLevel.medium,
                            preconditions=["The specific constraint from the scheduler message is confirmed."],
                            rollback="Revert the scheduling or resource change.",
                            verification="The node scheduler message clears and the pod is assigned to a node.",
                        )
                    ],
                )
            )
        else:
            findings.append(
                Finding(
                    kind=FindingKind.pending,
                    statement=f"Pod {pod.name} is stuck in the Pending phase.",
                    confidence=0.55,
                    severity=Severity.medium,
                    evidence=[phase_ev],
                    reasoning="Without a scheduling event, the cause is not yet determined.",
                    steps=[
                        _readonly_step(
                            f"kubectl describe pod {pod.name} -n {pod.namespace}",
                            "Look for the scheduling reason.",
                            "Events explaining why the pod is not scheduled.",
                        )
                    ],
                )
            )
    return findings, evidence


def _eval_events(events: list[EventInfo], pod: PodInfo, demo: bool) -> tuple[list[Finding], list[Evidence]]:
    evidence: list[Evidence] = []
    findings: list[Finding] = []

    for e in events:
        severity = Severity.medium if e.type == "Warning" else Severity.info
        ev = _ev(
            summary=f"Event {e.reason} ({e.type}, count={e.count}): {e.message}",
            source_resource=f"{e.namespace}/{e.involved_object}",
            payload=e.model_dump(mode="json"),
            severity=severity,
            timestamp=e.last_timestamp,
            provenance="events",
            demo=demo,
        )
        evidence.append(ev)

    probe_events = [e for e in events if e.reason == "Unhealthy" and "probe" in e.message.lower()]
    if probe_events:
        findings.append(
            Finding(
                kind=FindingKind.probe_failure,
                statement=f"Readiness/liveness probe failing: {probe_events[0].message}",
                confidence=0.7,
                severity=Severity.medium,
                evidence=[ev for ev in evidence if "Unhealthy" in ev.summary][:1],
                reasoning=(
                    "The kubelet reports probe failures. This means the process is not accepting "
                    "connections on the probe endpoint, which is often a symptom of an earlier "
                    "startup failure rather than the cause."
                ),
                steps=[
                    _readonly_step(
                        f"kubectl describe pod {pod.name} -n {pod.namespace}",
                        "Check the probe configuration and failure events.",
                        "probe path, port, and failure history.",
                    )
                ],
            )
        )
    return findings, evidence


_LOG_SIGNALS = [
    ("connection refused", "a dependency is refusing connections"),
    ("no such host", "a DNS name cannot be resolved"),
    ("out of memory", "the process ran out of memory"),
    ("panic:", "the process panicked"),
    ("traceback", "an unhandled exception occurred"),
]


def _eval_logs(logs: PodLogs, pod: PodInfo, demo: bool) -> tuple[list[Finding], list[Evidence]]:
    if not logs.lines:
        return [], []
    ev = _ev(
        summary=f"Pod logs (last {len(logs.lines)} lines) for {pod.namespace}/{pod.name}",
        source_resource=f"{pod.namespace}/{pod.name}",
        payload={"lines": logs.lines, "container": logs.container, "previous": logs.previous},
        severity=Severity.info,
        provenance="pod logs",
        demo=demo,
    )
    findings: list[Finding] = []
    joined = "\n".join(logs.lines).lower()
    for needle, description in _LOG_SIGNALS:
        if needle in joined:
            findings.append(
                Finding(
                    kind=FindingKind.connectivity,
                    statement=f"Logs indicate {description}.",
                    confidence=0.6,
                    severity=Severity.medium,
                    evidence=[ev],
                    reasoning=(
                        "Deterministic keyword match in the container logs. This is a lead from "
                        "logs, not a confirmed root cause — corroborate before acting."
                    ),
                    steps=[
                        _readonly_step(
                            f"kubectl logs -n {pod.namespace} {pod.name}",
                            "Read the full logs around the matched line.",
                            "The surrounding context.",
                        )
                    ],
                )
            )
            break
    return findings, [ev]


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def _confidence(findings: list[Finding]) -> float:
    if not findings:
        return 0.3
    top = max(f.confidence for f in findings)
    # Corroboration nudges confidence up, bounded.
    if len(findings) >= 2:
        top = min(0.95, top + 0.05)
    return round(top, 2)


def _risk(findings: list[Finding]) -> RiskLevel:
    order = [RiskLevel.none, RiskLevel.low, RiskLevel.medium, RiskLevel.high, RiskLevel.critical]
    mapping = {
        Severity.info: RiskLevel.none,
        Severity.low: RiskLevel.low,
        Severity.medium: RiskLevel.medium,
        Severity.high: RiskLevel.high,
        Severity.critical: RiskLevel.critical,
    }
    worst = RiskLevel.none
    for f in findings:
        risk = mapping[f.severity]
        if order.index(risk) > order.index(worst):
            worst = risk
    return worst


def diagnose_pod(
    client: KubernetesReadClient,
    namespace: str,
    name: str,
    *,
    log_tail_lines: int = 100,
) -> PodDiagnosis:
    settings = get_settings()
    demo = client.demo

    pod = client.get_pod(namespace, name)
    events = client.list_events(namespace, involved_object=name)

    # Logs are supporting evidence, not a prerequisite for diagnosis. Pods
    # that have never started (for example ImagePullBackOff) have no readable
    # container logs, and the Kubernetes API rejects the request. Continue
    # with pod status and events instead of failing the whole diagnosis.
    try:
        logs = client.get_pod_logs(namespace, name, tail_lines=log_tail_lines)
    except Exception:
        logs = PodLogs(
            namespace=namespace,
            pod=name,
            lines=[],
            truncated=False,
            demo=demo,
        )

    all_evidence: list[Evidence] = []
    findings: list[Finding] = []

    for container in pod.containers:
        f, e = _eval_container(container, pod, demo)
        findings.extend(f)
        all_evidence.extend(e)

    f, e = _eval_pod_phase(pod, events, demo)
    findings.extend(f)
    all_evidence.extend(e)

    f, e = _eval_events(events, pod, demo)
    findings.extend(f)
    all_evidence.extend(e)

    f, e = _eval_logs(logs, pod, demo)
    findings.extend(f)
    all_evidence.extend(e)

    restart_total = sum(c.restart_count for c in pod.containers)
    confirmed = [
        f"Pod {pod.namespace}/{pod.name} is in phase {pod.phase}"
        + (f" on node {pod.node_name}" if pod.node_name else " (not scheduled)"),
        f"Total container restart count: {restart_total}",
    ]
    for c in pod.containers:
        if c.last_reason:
            confirmed.append(
                f"Container {c.name} last terminated: reason={c.last_reason}"
                + (f", exitCode={c.last_exit_code}" if c.last_exit_code is not None else "")
            )

    hypotheses = [
        Hypothesis(
            statement=f.statement,
            confidence=f.confidence,
            evidence_ids=[ev.id for ev in f.evidence],
            reasoning=f.reasoning,
            alternative=False,
        )
        for f in findings
    ]

    if not hypotheses:
        summary = f"Pod {namespace}/{name} has no failure indicators in the collected evidence."
    else:
        summary = hypotheses[0].statement

    next_steps: list[RecommendedStep] = []
    seen_steps: set[str] = set()
    for f in findings:
        for step in f.steps:
            if step.action not in seen_steps:
                seen_steps.add(step.action)
                next_steps.append(step)

    remediation: list[Remediation] = []
    seen_remediation: set[str] = set()
    for f in findings:
        for r in f.remediations:
            if r.title not in seen_remediation:
                seen_remediation.add(r.title)
                remediation.append(r)

    missing: list[str] = []
    if not settings.prometheus_enabled:
        missing.append("Metrics are not configured; resource usage over time is unavailable.")
    if not settings.github_enabled:
        missing.append("GitHub is not configured; recent deploys/changes are unavailable.")

    diagnosis = Diagnosis(
        summary=summary,
        impact=(
            f"{restart_total} container restart(s) recorded across {len(pod.containers)} container(s)."
            if restart_total
            else None
        ),
        confirmed_observations=confirmed,
        hypotheses=hypotheses,
        evidence_ids=[ev.id for ev in all_evidence],
        confidence=_confidence(findings),
        confidence_basis=(
            f"{len(findings)} deterministic rule match(es) over pod status, events and logs."
            if findings
            else "No rule matched; confidence is low."
        ),
        missing_evidence=missing,
        next_steps=next_steps,
        remediation=remediation,
        risk_level=_risk(findings),
        model_generated=False,
    )

    return PodDiagnosis(
        cluster=client.cluster(),
        pod=pod,
        diagnosis=diagnosis,
        evidence=all_evidence,
    )
