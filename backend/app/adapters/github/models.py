"""Normalized, read-only GitHub Actions models.

The adapter converts GitHub's API payloads into these types so diagnosis rules
and API schemas never depend on GitHub's raw object shape.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class GitHubRun(BaseModel):
    id: int
    name: str | None = None
    display_title: str | None = None
    run_number: int | None = None
    run_attempt: int | None = None
    event: str | None = None
    status: str = "unknown"
    conclusion: str | None = None
    branch: str | None = None
    head_sha: str | None = None
    actor: str | None = None
    workflow_path: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    html_url: str | None = None
    demo: bool = False


class GitHubStep(BaseModel):
    number: int | None = None
    name: str
    status: str = "unknown"
    conclusion: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class GitHubJob(BaseModel):
    id: int
    name: str
    status: str = "unknown"
    conclusion: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    runner_name: str | None = None
    html_url: str | None = None
    steps: list[GitHubStep] = Field(default_factory=list)


class GitHubLogExcerpt(BaseModel):
    job_id: int
    job_name: str
    lines: list[str] = Field(default_factory=list)
    truncated: bool = False
