"""API schemas for the read-only GitHub Actions integration."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.adapters.github.models import GitHubJob, GitHubRun
from app.schemas.evidence import Evidence
from app.schemas.investigation import Diagnosis


class GitHubRunsResponse(BaseModel):
    repo: str
    runs: list[GitHubRun] = Field(default_factory=list)
    demo: bool = False


class GitHubRunResponse(BaseModel):
    repo: str
    run: GitHubRun
    jobs: list[GitHubJob] = Field(default_factory=list)
    demo: bool = False


class GitHubDiagnosisResponse(BaseModel):
    repo: str
    run: GitHubRun
    jobs: list[GitHubJob] = Field(default_factory=list)
    diagnosis: Diagnosis
    evidence: list[Evidence] = Field(default_factory=list)
    demo: bool = False
