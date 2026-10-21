"""Runbook contracts.

Runbook steps are read-only diagnostics. Remediation, when present, is a
separate human-reviewed action and is never executed by this service.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.evidence import Severity
from app.schemas.investigation import RiskLevel


class RunbookStep(BaseModel):
    title: str
    action: str
    command: str | None = None
    expected: str | None = None
    changes_state: bool = False
    risk: RiskLevel = RiskLevel.none


class Runbook(BaseModel):
    id: str
    title: str
    category: str
    severity: Severity
    summary: str
    symptoms: list[str] = Field(default_factory=list)
    applies_to: list[str] = Field(default_factory=list)
    steps: list[RunbookStep] = Field(default_factory=list)
    guardrails: list[str] = Field(default_factory=list)


class RunbookListResponse(BaseModel):
    runbooks: list[Runbook]
    total: int


class RunbookMatchRequest(BaseModel):
    kind: str = Field(min_length=1, max_length=120)
    signal: str | None = Field(default=None, max_length=500)


class RunbookMatchResponse(BaseModel):
    runbook: Runbook
    matched_on: str
