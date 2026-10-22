"""API tests for the read-only GitHub Actions endpoints."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

import app.api.v1.github as github_api
from app.adapters.github.models import GitHubJob, GitHubLogExcerpt, GitHubRun, GitHubStep
from app.core.config import Settings

NOW = datetime(2026, 10, 21, 12, 0, tzinfo=UTC)


class FakeClient:
    demo = False

    def list_runs(self, repo: str, *, branch: str | None = None, limit: int = 20):
        return [self._run()]

    def get_run(self, repo: str, run_id: int):
        return self._run()

    def list_jobs(self, repo: str, run_id: int):
        return [
            GitHubJob(
                id=201,
                name="test",
                status="completed",
                conclusion="failure",
                started_at=NOW,
                completed_at=NOW,
                steps=[
                    GitHubStep(
                        number=1,
                        name="Run tests",
                        status="completed",
                        conclusion="failure",
                        started_at=NOW,
                        completed_at=NOW,
                    )
                ],
            )
        ]

    def get_job_logs(self, repo: str, job_id: int, *, tail_lines: int = 200):
        return GitHubLogExcerpt(
            job_id=job_id,
            job_name="test",
            lines=["FAILED tests/test_api.py::test_login - AssertionError"],
        )

    @staticmethod
    def _run() -> GitHubRun:
        return GitHubRun(
            id=101,
            name="CI",
            run_number=42,
            status="completed",
            conclusion="failure",
            branch="main",
            head_sha="abcdef1234567890",
            created_at=NOW,
            updated_at=NOW,
            html_url="https://github.com/acme/demo/actions/runs/101",
        )


@pytest.fixture()
def fake_client(monkeypatch: pytest.MonkeyPatch) -> FakeClient:
    client = FakeClient()
    monkeypatch.setattr(github_api, "_client", lambda: client)
    return client


def test_list_runs(client: TestClient, fake_client: FakeClient) -> None:
    response = client.get("/api/v1/github/runs", params={"repo": "acme/demo"})

    assert response.status_code == 200
    body = response.json()
    assert body["repo"] == "acme/demo"
    assert body["runs"][0]["id"] == 101
    assert body["demo"] is False


def test_list_runs_accepts_and_normalizes_github_url(
    client: TestClient, fake_client: FakeClient
) -> None:
    response = client.get(
        "/api/v1/github/runs",
        params={"repo": "https://github.com/acme/demo.git"},
    )

    assert response.status_code == 200
    assert response.json()["repo"] == "acme/demo"


def test_run_detail_includes_jobs(client: TestClient, fake_client: FakeClient) -> None:
    response = client.get(
        "/api/v1/github/runs/101", params={"repo": "acme/demo"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["run"]["name"] == "CI"
    assert body["jobs"][0]["steps"][0]["name"] == "Run tests"


def test_diagnose_returns_evidence(client: TestClient, fake_client: FakeClient) -> None:
    response = client.post(
        "/api/v1/github/runs/101/diagnose",
        params={"repo": "acme/demo"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["diagnosis"]["model_generated"] is False
    assert body["diagnosis"]["hypotheses"]
    assert body["evidence"]
    assert all(e["source_type"] == "github" for e in body["evidence"])


def test_invalid_repo_is_rejected(client: TestClient) -> None:
    response = client.get("/api/v1/github/runs", params={"repo": "not-a-repo"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_disabled_integration_returns_503(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        github_api,
        "get_settings",
        lambda: Settings(github_enabled=False),
    )

    response = client.get("/api/v1/github/runs", params={"repo": "acme/demo"})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "not_configured"
