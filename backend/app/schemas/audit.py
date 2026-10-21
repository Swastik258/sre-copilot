"""Audit event read models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AuditEventOut(BaseModel):
    id: str
    user_id: str | None = None
    action: str
    actor: str
    resource: dict[str, Any] | None = None
    decision: str
    reason: str | None = None
    outcome: dict[str, Any] | None = None
    request_id: str | None = None
    created_at: datetime


class AuditEventListResponse(BaseModel):
    events: list[AuditEventOut]
    total: int


class AuditRetentionResponse(BaseModel):
    deleted: int
    older_than_days: int
