"""Tests for the read-only GitHub Actions adapter and diagnosis rules."""

from __future__ import annotations

import urllib.request
from datetime import UTC, datetime

import pytest

from app.adapters.github.client import (
    GitHubReadClient,
    RealGitHubClient,
    _SafeRedirectHandler,
    validate_repo,
)
from app.adapters.github.models import GitHubJob, GitHubLogExcerpt, GitHubRun, GitHubStep
from app.core.config import Settings
from app.core.errors import ValidationError
from app.services.github_diagnosis import diagnose_run

NOW = datetime(2026, 10, 21, 12, 0, tzinfo=UTC)


def _run(*, conclusion: str = "failure") -> GitHubRun:
    return GitHubRun(
        id=101,
        name="CI",
        display_title="Fix login redirect",
        run_number=42,
        run_attempt=1,
        event="push",
        status="completed",
        conclusion=conclusion,
        branch="main",
        head_sha="abcdef1234567890",
        actor="octocat",
        workflow_path=".github/workflows/ci.yml",
        created_at=NOW,
        updated_at=NOW,
        html_url="https://github.com/acme/demo/actions/runs/101",
    )


def _job(*, conclusion: str = "failure", step_conclusion: str = "failure") -> GitHubJob:
    return GitHubJob(
        id=201,
        name="test",
        status="completed",
        conclusion=conclusion,
        started_at=NOW,
        completed_at=NOW,
        runner_name="GitHub Actions 2",
        html_url="https://github.com/acme/demo/actions/runs/101/job/201",
        steps=[
            GitHubStep(
                number=1,
                name="Set up job",
                status="completed",
                conclusion="success",
                started_at=NOW,
                completed_at=NOW,
            ),
            GitHubStep(
                number=2,
                name="Run tests",
                status="completed",
                conclusion=step_conclusion,
                started_at=NOW,
                completed_at=NOW,
            ),
        ],
    )


class FakeGitHubClient:
    demo = False

    def __init__(
        self,
        *,
        run: GitHubRun | None = None,
        jobs: list[GitHubJob] | None = None,
        logs: dict[int, list[str]] | None = None,
        log_error: Exception | None = None,
    ) -> None:
        self.run = run or _run()
        self.jobs = jobs if jobs is not None else [_job()]
        self.logs = logs if logs is not None else {201: ["ok", "npm ERR! 404 Not Found"]}
        self.log_error = log_error

    def list_runs(self, repo: str, *, branch: str | None = None, limit: int = 20):
        return [self.run]

    def get_run(self, repo: str, run_id: int):
        assert run_id == self.run.id
        return self.run

    def list_jobs(self, repo: str, run_id: int):
        return self.jobs

    def get_job_logs(self, repo: str, job_id: int, *, tail_lines: int = 200):
        if self.log_error:
            raise self.log_error
        lines = self.logs.get(job_id, [])
        return GitHubLogExcerpt(
            job_id=job_id,
            job_name="test",
            lines=lines[-tail_lines:],
            truncated=len(lines) > tail_lines,
        )


@pytest.mark.parametrize("repo", ["acme/demo", " acme/demo ", "A_b-1/repo.name"])
def test_validate_repo_accepts_owner_name(repo: str) -> None:
    assert validate_repo(repo).strip() == repo.strip()


@pytest.mark.parametrize(
    ("repo", "expected"),
    [
        ("https://github.com/Swastik258/carbon-foot-print.git", "Swastik258/carbon-foot-print"),
        ("https://github.com/acme/demo/", "acme/demo"),
        ("https://www.github.com/acme/demo", "acme/demo"),
    ],
)
def test_validate_repo_normalizes_github_urls(repo: str, expected: str) -> None:
    assert validate_repo(repo) == expected


@pytest.mark.parametrize("repo", ["", "demo", "acme/demo/extra", "../repo", "acme/../repo"])
def test_validate_repo_rejects_invalid_shapes(repo: str) -> None:
    with pytest.raises(ValidationError):
        validate_repo(repo)


@pytest.mark.parametrize(
    "repo",
    [
        "https://evil.example/acme/demo",
        "https://github.com/acme/demo/actions",
        "https://user:password@github.com/acme/demo",
        "https://github.com:invalid/acme/demo",
        "https://github.com/acme/demo?tab=actions",
    ],
)
def test_validate_repo_rejects_non_repository_urls(repo: str) -> None:
    with pytest.raises(ValidationError):
        validate_repo(repo)


def test_adapter_exposes_only_read_operations() -> None:
    forbidden = {"create", "update", "delete", "dispatch", "rerun", "cancel"}
    public = {name for name in dir(RealGitHubClient) if not name.startswith("_")}
    assert not (public & forbidden)
    assert isinstance(FakeGitHubClient(), GitHubReadClient)


def test_cross_host_log_redirect_strips_authorization() -> None:
    handler = _SafeRedirectHandler()
    request = urllib.request.Request(
        "https://api.github.com/repos/acme/demo/actions/jobs/1/logs",
        headers={"Authorization": "Bearer secret-token"},
    )

    redirected = handler.redirect_request(
        request,
        None,
        302,
        "Found",
        {},
        "https://objects.githubusercontent.com/signed-log-url",
    )

    assert redirected is not None
    assert not redirected.has_header("Authorization")

    same_host = handler.redirect_request(
        request,
        None,
        302,
        "Found",
        {},
        "https://api.github.com/repos/acme/demo/actions/runs/1",
    )
    assert same_host is not None
    assert same_host.has_header("Authorization")


def test_diagnose_failed_job_and_dependency_log() -> None:
    result = diagnose_run(FakeGitHubClient(), "acme/demo", 101)

    assert result.diagnosis.model_generated is False
    assert "failed in job 'test'" in result.diagnosis.summary
    assert "Run tests" in result.diagnosis.summary
    assert any(h.statement == "Job 'test' failed." for h in result.diagnosis.hypotheses)
    assert any(
        "Dependency installation failed" in h.statement
        for h in result.diagnosis.hypotheses
    )
    assert result.diagnosis.remediation
    assert result.diagnosis.remediation[0].requires_approval is True
    assert result.diagnosis.evidence_ids
    assert all(e.source_type.value == "github" for e in result.evidence)
    assert all(e.redacted for e in result.evidence)


def test_diagnose_success_has_no_failure_hypotheses() -> None:
    result = diagnose_run(
        FakeGitHubClient(
            run=_run(conclusion="success"),
            jobs=[_job(conclusion="success", step_conclusion="success")],
        ),
        "acme/demo",
        101,
    )

    assert "completed successfully" in result.diagnosis.summary
    assert result.diagnosis.hypotheses == []
    assert result.diagnosis.next_steps == []
    assert result.diagnosis.confidence > 0.9


def test_logs_are_optional_when_github_does_not_return_them() -> None:
    result = diagnose_run(
        FakeGitHubClient(log_error=RuntimeError("logs unavailable")),
        "acme/demo",
        101,
    )

    assert "failed" in result.diagnosis.summary
    assert any("Logs were unavailable" in item for item in result.diagnosis.missing_evidence)
    assert result.diagnosis.evidence_ids


def test_pytest_failure_is_recognized() -> None:
    result = diagnose_run(
        FakeGitHubClient(logs={201: ["FAILED tests/test_api.py::test_login - AssertionError"]}),
        "acme/demo",
        101,
    )

    assert any("test failed" in h.statement.lower() for h in result.diagnosis.hypotheses)
    assert any("test" in r.title.lower() for r in result.diagnosis.remediation)


def test_unmatched_logs_are_reported_as_missing_evidence() -> None:
    result = diagnose_run(
        FakeGitHubClient(logs={201: ["ordinary output", "still nothing useful"]}),
        "acme/demo",
        101,
    )

    assert any("did not match" in item for item in result.diagnosis.missing_evidence)


def test_run_failure_without_failed_jobs_is_not_overclaimed() -> None:
    result = diagnose_run(
        FakeGitHubClient(jobs=[]),
        "acme/demo",
        101,
    )

    assert "no failed job details" in result.diagnosis.hypotheses[0].statement
    assert result.diagnosis.confidence == 0.5


def test_build_github_client_requires_configuration() -> None:
    from app.adapters.github.client import build_github_client
    from app.core.errors import NotConfiguredError

    with pytest.raises(NotConfiguredError):
        build_github_client(Settings(github_enabled=False))
    with pytest.raises(NotConfiguredError):
        build_github_client(Settings(github_enabled=True, github_token=None))
