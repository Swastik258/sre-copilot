"""Workspace-scoped access to audit events."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.models import AuditEvent


def list_for_workspace(
    db: Session,
    *,
    workspace_id: str,
    action: str | None = None,
    actor: str | None = None,
    user_id: str | None = None,
    decision: str | None = None,
    before: datetime | None = None,
    after: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[AuditEvent], int]:
    filters = [AuditEvent.workspace_id == workspace_id]
    if action is not None:
        filters.append(AuditEvent.action.contains(action))
    if actor is not None:
        filters.append(AuditEvent.actor == actor)
    if user_id is not None:
        filters.append(AuditEvent.user_id == user_id)
    if decision is not None:
        filters.append(AuditEvent.decision == decision)
    if before is not None:
        filters.append(AuditEvent.created_at < before)
    if after is not None:
        filters.append(AuditEvent.created_at >= after)
    total = (
        db.scalar(select(func.count()).select_from(AuditEvent).where(*filters)) or 0
    )
    rows = list(
        db.scalars(
            select(AuditEvent)
            .where(*filters)
            .order_by(AuditEvent.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    return rows, total


def rows_for_export(
    db: Session, *, workspace_id: str, user_id: str | None = None, limit: int = 5000
) -> list[AuditEvent]:
    filters = [AuditEvent.workspace_id == workspace_id]
    if user_id is not None:
        filters.append(AuditEvent.user_id == user_id)
    return list(
        db.scalars(
            select(AuditEvent)
            .where(*filters)
            .order_by(AuditEvent.created_at.desc())
            .limit(limit)
        )
    )


def delete_older_than(db: Session, *, workspace_id: str, cutoff: datetime) -> int:
    """Retention pruning, scoped to one workspace. Never crosses tenants."""
    result = db.execute(
        delete(AuditEvent)
        .where(AuditEvent.workspace_id == workspace_id, AuditEvent.created_at < cutoff)
        .execution_options(synchronize_session=False)
    )
    db.commit()
    return int(getattr(result, "rowcount", 0) or 0)


def count_for_workspace(db: Session, *, workspace_id: str) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(AuditEvent)
            .where(AuditEvent.workspace_id == workspace_id)
        )
        or 0
    )


def record(
    db: Session,
    *,
    workspace_id: str,
    user_id: str | None = None,
    action: str,
    actor: str,
    decision: str,
    resource: dict[str, Any] | None = None,
    reason: str | None = None,
    outcome: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> AuditEvent:
    """Append an audit event stamped with the acting workspace."""
    event = AuditEvent(
        user_id=user_id,
        workspace_id=workspace_id,
        action=action,
        actor=actor,
        resource=resource,
        decision=decision,
        reason=reason,
        outcome=outcome,
        request_id=request_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
