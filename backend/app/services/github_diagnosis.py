"""Deterministic GitHub Actions failure diagnosis.

The adapter supplies read-only workflow run, job, step and bounded log data.
This module correlates those facts into a structured diagnosis. It never calls
GitHub's mutating endpoints, and it never re-runs or cancels a workflow.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.adapters.github.client import GitHubReadClient
from app.adapters.github.models import GitHubJob, GitHubLogExcerpt, GitHubRun, GitHubStep
from app.core.config import get_settings
from app.core.redaction import redact_text
from app.schemas.evidence import Evidence, EvidenceSource, Severity
from app.schemas.investigation import (
    Diagnosis,
    Hypothesis,
    RecommendedStep,
    Remediation,
    RiskLevel,
)
from app.services.evidence import build_evidence

_FAILURE_CONCLUSIONS = {"failure", "timed_out", "startup_failure"}


@dataclass(frozen=True)
class LogRule:
    kind: str
    pattern: re.Pattern[str]
    statement: str
    remediation: str
    risk: RiskLevel = RiskLevel.medium


LOG_RULES: tuple[LogRule, ...] = (
    LogRule(
        kind="dependency_install",
        pattern=re.compile(r"(?i)\bnpm ERR!|pnpm ERR|yarn error|ERESOLVE|Could not resolve dependencies"),
        statement="Dependency installation failed before the workflow could run.",
        remediation="Fix the dependency resolution error and update the lockfile in a branch.",
        risk=RiskLevel.low,
    ),
    LogRule(
        kind="python_import",
        pattern=re.compile(r"(?i)ModuleNotFoundError|ImportError|No module named"),
        statement="A Python module was missing or failed to import.",
        remediation="Install or pin the missing Python dependency in the workflow environment.",
        risk=RiskLevel.low,
    ),
    LogRule(
        kind="test_failure",
        pattern=re.compile(r"(?i)\bFAILED\b|AssertionError|Test failed|pytest.*failed"),
        statement="A test failed in the job that ran the test suite.",
        remediation="Reproduce the failing test locally and fix the test or the change it exercises.",
    ),
    LogRule(
        kind="permission",
        pattern=re.compile(r"(?i)permission denied|EACCES|access denied"),
        statement="The workflow encountered a filesystem or resource permission error.",
        remediation="Check the runner user, file modes, and token permissions for the failing step.",
    ),
    LogRule(
        kind="command_missing",
        pattern=re.compile(r"(?i)command not found"),
        statement="A command required by the workflow is not installed on the runner.",
        remediation="Install the tool or correct the command in the workflow.",
        risk=RiskLevel.low,
    ),
    LogRule(
        kind="image_pull",
        pattern=re.compile(
            r"(?i)manifest unknown|pull access denied|ErrImagePull|ImagePullBackOff|"
            r"unauthorized: authentication required"
        ),
        statement="A container image could not be pulled.",
        remediation="Check the image reference, registry credentials, and image availability.",
    ),
    LogRule(
        kind="timeout",
        pattern=re.compile(r"(?i)timed out|timeout"),
        statement="A step or command exceeded its timeout.",
        remediation="Inspect the slow step and raise the timeout only after confirming the operation can finish.",
        risk=RiskLevel.low,
    ),
    LogRule(
        kind="oom",
        pattern=re.compile(r"(?i)out of memory|OOMKilled|Killed process"),
        statement="A process ran out of memory.",
        remediation="Reduce memory use or increase the runner/container memory limit.",
    ),
    LogRule(
        kind="missing_path",
        pattern=re.compile(r"(?i)No such file or directory|ENOENT"),
        statement="A required file or path was missing in the workflow environment.",
        remediation="Check the checkout, working directory, and generated artifact paths.",
        risk=RiskLevel.low,
    ),
)


@dataclass
class GitHubDiagnosisResult:
    repo: str
    run: GitHubRun
    jobs: list[GitHubJob]
    diagnosis: Diagnosis
    evidence: list[Evidence] = field(default_factory=list)


def _ev(**kwargs) -> Evidence:
    kwargs.setdefault("source_type", EvidenceSource.github)
    settings = get_settings()
    return build_evidence(redaction_enabled=settings.redaction_enabled, **kwargs)


def _step(action: str, purpose: str, expected: str) -> RecommendedStep:
    return RecommendedStep(
        action=action,
        purpose=purpose,
        expected_output=expected,
        changes_state=False,
        risk=RiskLevel.none,
    )


def _failed_steps(job: GitHubJob) -> list[GitHubStep]:
    return [step for step in job.steps if step.conclusion in {"failure", "timed_out"}]


def _run_summary(run: GitHubRun) -> str:
    name = run.name or "workflow"
    number = run.run_number or run.id
    branch = run.branch or "unknown branch"
    conclusion = run.conclusion or run.status
    sha = (run.head_sha or "")[:8]
    return (
        f"Workflow run #{number} '{name}' concluded {conclusion} on {branch}"
        + (f" at commit {sha}" if sha else "")
        + "."
    )


def _log_evidence(
    *,
    repo: str,
    run: GitHubRun,
    job: GitHubJob,
    excerpt: GitHubLogExcerpt,
    severity: Severity,
) -> Evidence:
    matched = [
        line
        for line in excerpt.lines
        if any(rule.pattern.search(line) for rule in LOG_RULES)
    ][:5]
    summary = (
        f"Job '{job.name}' log excerpt ({len(excerpt.lines)} lines, "
        f"truncated={excerpt.truncated})."
    )
    if matched:
        summary += " Matched: " + " | ".join(matched)
    else:
        summary += " No known failure pattern matched."
    return _ev(
        summary=summary,
        source_resource=f"{repo}#run/{run.id}/job/{job.id}",
        payload=excerpt.model_dump(mode="json"),
        severity=severity,
        timestamp=job.completed_at or run.updated_at,
        provenance=f"GitHub Actions API /repos/{repo}/actions/jobs/{job.id}/logs",
    )


def diagnose_run(
    client: GitHubReadClient,
    repo: str,
    run_id: int,
    *,
    log_tail_lines: int = 200,
) -> GitHubDiagnosisResult:
    """Correlate a run, its jobs, failed steps, and bounded log excerpts."""

    run = client.get_run(repo, run_id)
    jobs = client.list_jobs(repo, run_id)

    evidence: list[Evidence] = []
    hypotheses: list[Hypothesis] = []
    confirmed: list[str] = []
    missing: list[str] = []
    next_steps: list[RecommendedStep] = []
    remediations: list[Remediation] = []

    run_ev = _ev(
        summary=_run_summary(run),
        source_resource=f"{repo}#run/{run.id}",
        payload=run.model_dump(mode="json"),
        severity=(
            Severity.high
            if run.conclusion in _FAILURE_CONCLUSIONS
            else Severity.medium
            if run.conclusion == "cancelled"
            else Severity.info
        ),
        timestamp=run.updated_at,
        provenance=f"GitHub Actions API /repos/{repo}/actions/runs/{run.id}",
    )
    evidence.append(run_ev)
    confirmed.append(_run_summary(run))

    failed_jobs: list[GitHubJob] = []
    failed_step_by_job: dict[int, GitHubStep] = {}
    failed_step_evidence: dict[int, str] = {}

    for job in jobs:
        job_failed = job.conclusion in _FAILURE_CONCLUSIONS
        job_ev = _ev(
            summary=(
                f"Job '{job.name}' concluded {job.conclusion or job.status}"
                f" with {len(job.steps)} step(s)."
            ),
            source_resource=f"{repo}#run/{run.id}/job/{job.id}",
            payload=job.model_dump(mode="json"),
            severity=Severity.high if job_failed else Severity.info,
            timestamp=job.completed_at or run.updated_at,
            provenance=f"GitHub Actions API /repos/{repo}/actions/runs/{run.id}/jobs",
        )
        evidence.append(job_ev)
        confirmed.append(f"Job '{job.name}' concluded {job.conclusion or job.status}.")
        if job_failed:
            failed_jobs.append(job)

        step_evidence: list[Evidence] = []
        for step in job.steps:
            step_failed = step.conclusion in {"failure", "timed_out"}
            step_ev = _ev(
                summary=(
                    f"Step '{step.name}' in job '{job.name}' concluded "
                    f"{step.conclusion or step.status}."
                ),
                source_resource=f"{repo}#run/{run.id}/job/{job.id}/step/{step.number or '?'}",
                payload=step.model_dump(mode="json"),
                severity=Severity.high if step_failed else Severity.info,
                timestamp=step.completed_at or job.completed_at or run.updated_at,
                provenance=f"GitHub Actions API /repos/{repo}/actions/runs/{run.id}/jobs",
            )
            evidence.append(step_ev)
            step_evidence.append(step_ev)
            if step_failed:
                confirmed.append(
                    f"Step '{step.name}' in job '{job.name}' concluded "
                    f"{step.conclusion or step.status}."
                )
                failed_step_by_job.setdefault(job.id, step)
                failed_step_evidence.setdefault(job.id, step_ev.id)

        if job_failed:
            first_failed = failed_step_by_job.get(job.id)
            cited = [job_ev.id] + [ev.id for ev in step_evidence if ev.severity == Severity.high]
            hypotheses.append(
                Hypothesis(
                    statement=f"Job '{job.name}' failed.",
                    confidence=0.9,
                    evidence_ids=cited,
                    reasoning="The job's conclusion is a failure state reported by GitHub.",
                )
            )
            if first_failed is not None:
                hypotheses.append(
                    Hypothesis(
                        statement=(
                            f"Step '{first_failed.name}' in job '{job.name}' is the "
                            "first failed step."
                        ),
                        confidence=0.85,
                        evidence_ids=[job_ev.id, failed_step_evidence[job.id]]
                        if job.id in failed_step_evidence
                        else [job_ev.id],
                        reasoning="GitHub reported this step with a failure conclusion.",
                    )
                )

    # Fetch bounded logs for failed jobs; logs are supporting evidence, never a
    # prerequisite for a diagnosis.
    seen_log_rules: set[str] = set()
    for job in failed_jobs[:5]:
        try:
            excerpt = client.get_job_logs(repo, job.id, tail_lines=log_tail_lines)
            excerpt.job_name = job.name
        except Exception:
            missing.append(f"Logs were unavailable for job '{job.name}'.")
            continue

        log_ev = _log_evidence(
            repo=repo,
            run=run,
            job=job,
            excerpt=excerpt,
            severity=Severity.high,
        )
        evidence.append(log_ev)
        confirmed.append(
            f"Collected {len(excerpt.lines)} log line(s) from job '{job.name}'."
        )
        if not excerpt.lines:
            missing.append(f"Job '{job.name}' returned an empty log excerpt.")
            continue

        matched_any = False
        for rule in LOG_RULES:
            if rule.kind in seen_log_rules:
                continue
            match = next(
                (line for line in excerpt.lines if rule.pattern.search(line)),
                None,
            )
            if match is None:
                continue
            matched_any = True
            seen_log_rules.add(rule.kind)
            safe_line = redact_text(match.strip()[:300], enabled=True)
            hypotheses.append(
                Hypothesis(
                    statement=rule.statement,
                    confidence=0.8,
                    evidence_ids=[log_ev.id],
                    reasoning=f"Matched log line: {safe_line}",
                )
            )
            remediations.append(
                Remediation(
                    title=rule.statement.rstrip("."),
                    description=rule.remediation,
                    changes_state=True,
                    risk=rule.risk,
                    preconditions=["Review the failed job and the commit that triggered the run."],
                    verification="The workflow passes on a new run after the fix is reviewed.",
                    requires_approval=True,
                )
            )
            if len(remediations) >= 3:
                break

        if not matched_any:
            missing.append(
                f"Logs for job '{job.name}' did not match a known failure pattern; "
                "inspect the full log."
            )

    # Run-level hypotheses for non-failure outcomes.
    if run.conclusion == "cancelled":
        hypotheses.append(
            Hypothesis(
                statement="The workflow run was cancelled before it completed.",
                confidence=0.8,
                evidence_ids=[run_ev.id],
                reasoning="GitHub reports the run conclusion as cancelled.",
            )
        )
    elif run.conclusion == "timed_out":
        hypotheses.append(
            Hypothesis(
                statement="The workflow run exceeded its time limit.",
                confidence=0.8,
                evidence_ids=[run_ev.id],
                reasoning="GitHub reports the run conclusion as timed_out.",
            )
        )
    elif run.conclusion == "startup_failure":
        hypotheses.append(
            Hypothesis(
                statement="The workflow failed before its jobs could start.",
                confidence=0.85,
                evidence_ids=[run_ev.id],
                reasoning="GitHub reports the run conclusion as startup_failure.",
            )
        )
    elif run.conclusion == "failure" and not failed_jobs:
        hypotheses.append(
            Hypothesis(
                statement="The run failed, but GitHub returned no failed job details.",
                confidence=0.5,
                evidence_ids=[run_ev.id],
                reasoning="The run conclusion is failure, but the jobs response was empty.",
            )
        )

    # Read-only next steps.
    next_steps.append(
        _step(
            "Open the workflow run and inspect the failed job log.",
            "See the surrounding context for the first failed step.",
            "The exact command and exit status that caused the failure.",
        )
    )
    if failed_jobs:
        next_steps.append(
            _step(
                f"Compare job '{failed_jobs[0].name}' with the commit on "
                f"{run.branch or 'the affected branch'}.",
                "Determine whether the failure is new or pre-existing.",
                "Changed files and dependency updates associated with the commit.",
            )
        )
    if not failed_jobs and run.conclusion not in {"success", None}:
        next_steps.append(
            _step(
                "Open the run and check whether the workflow has job-level logs.",
                "Determine why no failed job details were returned.",
                "Run-level logs or a permissions error.",
            )
        )
    if run.conclusion == "success":
        next_steps = []

    summary = _run_summary(run)
    if failed_jobs:
        first = failed_jobs[0]
        first_step = failed_step_by_job.get(first.id)
        summary = (
            f"Workflow run #{run.run_number or run.id} failed in job '{first.name}'"
            + (f" at step '{first_step.name}'" if first_step else "")
            + "."
        )
    elif run.conclusion == "success":
        summary = (
            f"Workflow run #{run.run_number or run.id} completed successfully; "
            "no failure diagnosis is needed."
        )
    elif run.conclusion == "cancelled":
        summary = f"Workflow run #{run.run_number or run.id} was cancelled."
    elif run.conclusion == "timed_out":
        summary = f"Workflow run #{run.run_number or run.id} timed out."
    elif run.conclusion == "startup_failure":
        summary = f"Workflow run #{run.run_number or run.id} failed to start."

    confidence = 0.2
    if failed_jobs:
        confidence = 0.9
    elif run.conclusion in {"timed_out", "startup_failure"}:
        confidence = 0.8
    elif run.conclusion == "cancelled":
        confidence = 0.7
    elif run.conclusion == "failure":
        confidence = 0.5
    elif run.conclusion == "success":
        confidence = 0.95

    diagnosis = Diagnosis(
        summary=summary,
        impact=(
            "The workflow did not complete successfully; downstream checks or "
            "deployments may be blocked."
            if run.conclusion in _FAILURE_CONCLUSIONS
            else None
        ),
        confirmed_observations=confirmed[:20],
        hypotheses=hypotheses[:12],
        evidence_ids=[item.id for item in evidence],
        confidence=confidence,
        confidence_basis=(
            "Deterministic correlation of run, jobs, failed steps and bounded "
            "log excerpts."
        ),
        missing_evidence=missing[:12],
        next_steps=next_steps[:5],
        remediation=remediations[:3],
        risk_level=RiskLevel.medium if remediations else RiskLevel.none,
        model_generated=False,
    )
    return GitHubDiagnosisResult(
        repo=repo,
        run=run,
        jobs=jobs,
        diagnosis=diagnosis,
        evidence=evidence,
    )
