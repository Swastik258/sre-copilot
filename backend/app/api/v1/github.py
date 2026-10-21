"""Read-only GitHub Actions endpoints.

All routes issue only GET requests through the adapter. There are no dispatch,
re-run, cancel, or secret-writing endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.adapters.github.client import build_github_client, validate_repo
from app.core.config import get_settings
from app.schemas.github import (
    GitHubDiagnosisResponse,
    GitHubRunResponse,
    GitHubRunsResponse,
)
from app.services.github_diagnosis import diagnose_run

router = APIRouter(prefix="/github", tags=["github"])


def _client():
    return build_github_client(get_settings())


@router.get("/runs", response_model=GitHubRunsResponse)
def list_runs(
    repo: str = Query(..., min_length=3, max_length=200),
    branch: str | None = Query(default=None, max_length=255),
    limit: int = Query(default=20, ge=1, le=100),
) -> GitHubRunsResponse:
    normalized = validate_repo(repo)
    client = _client()
    return GitHubRunsResponse(
        repo=normalized,
        runs=client.list_runs(normalized, branch=branch, limit=limit),
        demo=client.demo,
    )


@router.get("/runs/{run_id}", response_model=GitHubRunResponse)
def get_run(
    run_id: int,
    repo: str = Query(..., min_length=3, max_length=200),
) -> GitHubRunResponse:
    normalized = validate_repo(repo)
    client = _client()
    return GitHubRunResponse(
        repo=normalized,
        run=client.get_run(normalized, run_id),
        jobs=client.list_jobs(normalized, run_id),
        demo=client.demo,
    )


@router.post("/runs/{run_id}/diagnose", response_model=GitHubDiagnosisResponse)
def diagnose_run_endpoint(
    run_id: int,
    repo: str = Query(..., min_length=3, max_length=200),
    log_tail_lines: int = Query(default=200, ge=1, le=1000),
) -> GitHubDiagnosisResponse:
    normalized = validate_repo(repo)
    result = diagnose_run(
        _client(),
        normalized,
        run_id,
        log_tail_lines=log_tail_lines,
    )
    return GitHubDiagnosisResponse(
        repo=result.repo,
        run=result.run,
        jobs=result.jobs,
        diagnosis=result.diagnosis,
        evidence=result.evidence,
        demo=False,
    )
