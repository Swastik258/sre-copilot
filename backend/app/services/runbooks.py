"""Deterministic runbook library and matching.

The catalog is intentionally static and read-only. It gives operators a safe
starting sequence for common evidence-backed findings; it does not execute any
step and every state-changing remediation remains an explicit human decision.
"""

from __future__ import annotations

from app.core.errors import NotFoundError
from app.schemas.evidence import Severity
from app.schemas.investigation import RiskLevel
from app.schemas.runbooks import (
    Runbook,
    RunbookListResponse,
    RunbookMatchRequest,
    RunbookMatchResponse,
    RunbookStep,
)


def _step(
    title: str,
    action: str,
    *,
    command: str | None = None,
    expected: str | None = None,
) -> RunbookStep:
    return RunbookStep(
        title=title,
        action=action,
        command=command,
        expected=expected,
        changes_state=False,
        risk=RiskLevel.none,
    )


RUNBOOKS: list[Runbook] = [
    Runbook(
        id="crashloop-backoff",
        title="CrashLoopBackOff triage",
        category="kubernetes",
        severity=Severity.high,
        summary=(
            "A container starts, exits, and is restarted repeatedly. Confirm the "
            "exit reason before changing the image, configuration, or resources."
        ),
        symptoms=["restart count climbing", "last state terminated", "back-off delay"],
        applies_to=["crashloop", "crash_loop", "restart", "exit code", "terminated"],
        steps=[
            _step(
                "Inspect pod status and last termination",
                "Read the container state, last state, exit code, and restart count.",
                command="kubectl describe pod <pod> -n <namespace>",
                expected="A specific exit code or termination reason.",
            ),
            _step(
                "Read previous container logs",
                "Use the previous instance because the current container may be too new.",
                command="kubectl logs <pod> -n <namespace> --previous --tail=200",
                expected="The application error immediately before exit.",
            ),
            _step(
                "Check recent events and config references",
                "Look for missing ConfigMaps, Secrets, or failing probes.",
                command="kubectl get events -n <namespace> --sort-by=.lastTimestamp",
            ),
        ],
        guardrails=[
            "Do not delete the pod as a first response; it hides the failing instance.",
            "Do not raise restart limits or remove liveness probes without evidence.",
            "Any manifest change is a proposal requiring review and approval.",
        ],
    ),
    Runbook(
        id="image-pull-failure",
        title="ImagePullBackOff and ErrImagePull",
        category="kubernetes",
        severity=Severity.high,
        summary=(
            "The kubelet cannot pull the image. Separate registry authentication "
            "from a missing tag, a network path, and a platform mismatch."
        ),
        symptoms=["ErrImagePull", "ImagePullBackOff", "401/403 from registry", "manifest unknown"],
        applies_to=["imagepull", "image_pull", "errimagepull", "registry", "pull access"],
        steps=[
            _step(
                "Read the exact pull error",
                "Capture the event message and the image reference.",
                command="kubectl describe pod <pod> -n <namespace>",
            ),
            _step(
                "Verify the image and tag exist",
                "Check the registry manifest or release metadata for the exact tag.",
                expected="The tag resolves and the digest is the expected one.",
            ),
            _step(
                "Check imagePullSecrets and registry auth",
                "Confirm the service account or pod references a valid pull secret.",
                command="kubectl get pod <pod> -n <namespace> -o jsonpath='{.spec.imagePullSecrets}'",
            ),
        ],
        guardrails=[
            "Never print or commit registry credentials.",
            "Avoid switching to a mutable latest tag to work around a missing tag.",
            "Changing imagePullSecrets is a proposed manifest change, not an automatic action.",
        ],
    ),
    Runbook(
        id="oom-killed",
        title="OOMKilled or memory pressure",
        category="kubernetes",
        severity=Severity.critical,
        summary=(
            "The kernel terminated the container for exceeding available memory. "
            "Check the limit, the working set, and whether the process leaks."
        ),
        symptoms=["exit code 137", "OOMKilled", "memory limit", "node pressure"],
        applies_to=["oom", "oomkilled", "exit code 137", "memory"],
        steps=[
            _step(
                "Confirm OOMKilled and the limit",
                "Read the last termination reason, exit code, and container resources.",
                command="kubectl get pod <pod> -n <namespace> -o jsonpath='{.status.containerStatuses[*].lastState}'",
            ),
            _step(
                "Compare usage to the limit over time",
                "Use container memory working-set metrics; do not infer from a single sample.",
                command="kubectl top pod <pod> -n <namespace> --containers",
            ),
            _step(
                "Inspect allocation patterns and traffic",
                "Check recent deploy, batch job, or traffic changes before raising limits.",
            ),
        ],
        guardrails=[
            "Raising a limit without understanding growth can move the outage to the node.",
            "Do not remove the memory limit entirely.",
            "Resource changes are proposals with review and rollback plans.",
        ],
    ),
    Runbook(
        id="redis-connection",
        title="Redis/backend dependency connection failures",
        category="application",
        severity=Severity.high,
        summary=(
            "Connection refused, DNS failure, or timeout to a dependency. Verify "
            "the endpoint, network path, and dependency health before retrying."
        ),
        symptoms=["ECONNREFUSED", "connection reset", "DNS lookup failure", "timeout"],
        applies_to=["redis", "econnrefused", "connection refused", "timeout", "dependency"],
        steps=[
            _step(
                "Identify the failing endpoint",
                "Extract the host, port, and error class from the log signature.",
            ),
            _step(
                "Check DNS and network reachability from the same namespace",
                "Use a read-only diagnostic pod or an existing debug container.",
                command="kubectl run <debug-pod> --rm -it --image=busybox -- nslookup <host>",
            ),
            _step(
                "Check dependency health and recent changes",
                "Look at service endpoints, restarts, and deploy history.",
                command="kubectl get endpoints <service> -n <namespace>",
            ),
            _step(
                "Verify retry and timeout behavior",
                "Confirm retries are bounded and do not amplify load during an outage.",
            ),
        ],
        guardrails=[
            "Do not run a destructive connection test against production.",
            "Do not expose credentials in logs or chat.",
            "Restarting a dependency is a state-changing action requiring approval.",
        ],
    ),
    Runbook(
        id="github-actions-failure",
        title="GitHub Actions failure triage",
        category="ci",
        severity=Severity.medium,
        summary=(
            "Separate a test failure from an infrastructure, permissions, or "
            "dependency failure. Start from the failed step log, not the summary."
        ),
        symptoms=["workflow conclusion failure", "failed job step", "permission denied", "timeout"],
        applies_to=["github", "workflow", "actions", "ci", "pipeline", "job"],
        steps=[
            _step(
                "Identify the first failed step",
                "Read the failed job and step, then the bounded log excerpt.",
                command="gh run view <run-id> --repo <owner/repo> --log-failed",
            ),
            _step(
                "Check whether the failure is reproducible",
                "Compare the commit, branch, runner image, and dependency lockfile.",
            ),
            _step(
                "Review token and workflow permissions",
                "A 403 often means a missing read permission, not a code defect.",
            ),
        ],
        guardrails=[
            "Do not re-run or dispatch a workflow from the diagnostic path.",
            "Do not paste full logs that may contain secrets; use the redacted excerpt.",
            "Changing workflow permissions is a reviewed repository change.",
        ],
    ),
    Runbook(
        id="terraform-replace",
        title="Terraform replacement or destroy review",
        category="infrastructure",
        severity=Severity.critical,
        summary=(
            "Replacement and destroy actions can cause data loss or downtime. "
            "Verify the force-new path, state, backups, and rollback before apply."
        ),
        symptoms=["replace action", "destroy action", "force-new attribute", "stateful resource"],
        applies_to=["terraform", "replace", "destroy", "force new", "stateful", "plan"],
        steps=[
            _step(
                "List every replace/destroy and its reason",
                "Read the plan review, changed attribute names, and replacement paths.",
            ),
            _step(
                "Confirm backups and restore procedure",
                "For stateful resources, verify a recent backup and a tested restore path.",
            ),
            _step(
                "Check create-before-destroy and dependency order",
                "A delete-then-create replacement has a different outage window.",
            ),
            _step(
                "Stage a reviewed plan",
                "Apply only after a human approves the diff and rollback plan.",
            ),
        ],
        guardrails=[
            "This product never runs terraform apply.",
            "Never paste state files or credentials into a chat or ticket.",
            "Attribute values are intentionally omitted from review output.",
        ],
    ),
    Runbook(
        id="error-rate-spike",
        title="Error-rate or latency spike",
        category="observability",
        severity=Severity.high,
        summary=(
            "Correlate the spike with deploys, dependency health, saturation, and "
            "traffic changes. A timing match is a lead, not a root cause."
        ),
        symptoms=["5xx rate", "p99 latency", "error budget burn", "timeout rate"],
        applies_to=["error rate", "latency", "metric", "prometheus", "5xx", "p99"],
        steps=[
            _step(
                "Scope the spike by service, endpoint, and region",
                "Compare the affected series with adjacent time windows.",
            ),
            _step(
                "Correlate with deploy and config events",
                "Check deploy timestamps and feature-flag changes around the first signal.",
            ),
            _step(
                "Check saturation and dependency health",
                "CPU, memory, connection pools, queues, and downstream error rates.",
            ),
            _step(
                "Verify a rollback path before changing traffic",
                "Prefer a reversible mitigation with a clear success metric.",
            ),
        ],
        guardrails=[
            "Correlation output is not causation.",
            "Do not scale or roll back automatically; make the proposal explicit.",
            "Watch for retry amplification when error rates rise.",
        ],
    ),
    Runbook(
        id="general-triage",
        title="General evidence-first triage",
        category="general",
        severity=Severity.medium,
        summary=(
            "When the finding is unclear, establish the timeline, the affected "
            "scope, and the last known good state before proposing a change."
        ),
        symptoms=["unknown failure", "mixed signals", "insufficient evidence"],
        applies_to=["general", "unknown", "triage"],
        steps=[
            _step(
                "Write the timeline",
                "First signal, last known good, deploys, config changes, and recovery attempts.",
            ),
            _step(
                "Define the blast radius",
                "Which users, services, regions, and data paths are affected?",
            ),
            _step(
                "Collect the smallest useful evidence set",
                "Prefer a few authoritative records over a large raw dump.",
            ),
            _step(
                "State what would falsify the leading hypothesis",
                "Choose a read-only check that can change your mind.",
            ),
        ],
        guardrails=[
            "Never make a state-changing change without an explicit approval step.",
            "Redact credentials and customer data from evidence.",
        ],
    ),
]


def list_runbooks(query: str | None = None, category: str | None = None) -> RunbookListResponse:
    items = RUNBOOKS
    if category:
        items = [item for item in items if item.category == category]
    if query:
        needle = query.strip().lower()
        items = [
            item
            for item in items
            if needle in item.title.lower()
            or needle in item.summary.lower()
            or needle in item.category.lower()
            or any(needle in symptom.lower() for symptom in item.symptoms)
        ]
    return RunbookListResponse(runbooks=items, total=len(items))


def get_runbook(runbook_id: str) -> Runbook:
    for item in RUNBOOKS:
        if item.id == runbook_id:
            return item
    raise NotFoundError("Runbook not found", details={"id": runbook_id})


def match_runbook(payload: RunbookMatchRequest) -> RunbookMatchResponse:
    haystack = f"{payload.kind} {payload.signal or ''}".lower()
    best: tuple[int, Runbook, str] | None = None
    for runbook in RUNBOOKS:
        for term in runbook.applies_to:
            if term in haystack:
                score = len(term)
                if best is None or score > best[0]:
                    best = (score, runbook, term)
    if best is None:
        return RunbookMatchResponse(
            runbook=get_runbook("general-triage"),
            matched_on="general fallback",
        )
    return RunbookMatchResponse(runbook=best[1], matched_on=best[2])
