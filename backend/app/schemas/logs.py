"""Log analysis request/response contracts."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.evidence import Evidence, Severity


class LogAnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1_000_000)
    source: str | None = Field(default=None, max_length=300)
    environment: str | None = Field(default=None, max_length=120)
    limit: int = Field(default=50, ge=1, le=200)


class LogSignature(BaseModel):
    id: str
    signature: str
    severity: Severity
    count: int
    first_seen: datetime | None = None
    last_seen: datetime | None = None
    sample: str
    frames: list[str] = Field(default_factory=list)
    evidence_id: str | None = None


class LogAnalyzeResponse(BaseModel):
    total_lines: int
    parsed_lines: int
    truncated: bool
    signatures: list[LogSignature]
    summary: str
    evidence: list[Evidence]
    demo: bool = False
