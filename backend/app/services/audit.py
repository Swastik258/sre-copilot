"""Audit event recording.

Audit events capture sensitive or security-relevant actions (approvals,
integration changes, credential use). Resource and outcome payloads are redacted
before persistence.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.redaction import redact_obj
from app.core.request_context import get_request_id
from app.db.models import AuditEvent
from app.schemas.audit import AuditEventListResponse, AuditEventOut, AuditRetentionResponse


def record_event(
    db: Session,
    *,
    action: str,
    actor: str,
    decision: str,
    user_id: str | None = None,
    tenant_id: str = "default",
    resource: dict[str, Any] | None = None,
    reason: str | None = None,
    outcome: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> AuditEvent:
    settings = get_settings()
    enabled = settings.redaction_enabled
    event = AuditEvent(
        user_id=user_id,
        tenant_id=tenant_id,
        action=action,
        actor=actor,
        resource=redact_obj(resource, enabled=enabled),
        decision=decision,
        reason=reason,
        outcome=redact_obj(outcome, enabled=enabled),
        request_id=request_id or get_request_id(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def _out(event: AuditEvent) -> AuditEventOut:
    return AuditEventOut(
        id=event.id,
        user_id=event.user_id,
        action=event.action,
        actor=event.actor,
        resource=event.resource,
        decision=event.decision,
        reason=event.reason,
        outcome=event.outcome,
        request_id=event.request_id,
        created_at=event.created_at,
    )


def list_events(
    db: Session,
    *,
    user_id: str | None = None,
    tenant_id: str | None = None,
    action: str | None = None,
    actor: str | None = None,
    decision: str | None = None,
    before: datetime | None = None,
    after: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> AuditEventListResponse:
    filters = []
    if user_id:
        filters.append(AuditEvent.user_id == user_id)
    if tenant_id:
        filters.append(AuditEvent.tenant_id == tenant_id)
    if action:
        filters.append(AuditEvent.action.contains(action))
    if actor:
        filters.append(AuditEvent.actor == actor)
    if decision:
        filters.append(AuditEvent.decision == decision)
    if before:
        filters.append(AuditEvent.created_at < before)
    if after:
        filters.append(AuditEvent.created_at >= after)

    total = db.scalar(select(func.count()).select_from(AuditEvent).where(*filters)) or 0
    rows = list(
        db.scalars(
            select(AuditEvent)
            .where(*filters)
            .order_by(AuditEvent.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    return AuditEventListResponse(events=[_out(row) for row in rows], total=total)


def export_rows(
    db: Session,
    *,
    limit: int = 5000,
    user_id: str | None = None,
    tenant_id: str | None = None,
) -> list[AuditEventOut]:
    filters = []
    if user_id:
        filters.append(AuditEvent.user_id == user_id)
    if tenant_id:
        filters.append(AuditEvent.tenant_id == tenant_id)
    rows = list(
        db.scalars(
            select(AuditEvent)
            .where(*filters)
            .order_by(AuditEvent.created_at.desc())
            .limit(limit)
        )
    )
    return [_out(row) for row in rows]


def apply_retention(
    db: Session,
    days: int,
    *,
    user_id: str | None = None,
    tenant_id: str | None = None,
) -> AuditRetentionResponse:
    cutoff = datetime.now(UTC) - timedelta(days=max(1, days))
    filters = [AuditEvent.created_at < cutoff]
    if user_id:
        filters.append(AuditEvent.user_id == user_id)
    if tenant_id:
        filters.append(AuditEvent.tenant_id == tenant_id)
    result = db.execute(delete(AuditEvent).where(*filters))
    db.commit()
    return AuditRetentionResponse(deleted=int(result.rowcount or 0), older_than_days=days)
