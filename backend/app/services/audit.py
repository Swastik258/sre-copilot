"""Audit event recording.

Audit events capture sensitive or security-relevant actions (approvals,
integration changes, credential use). Resource and outcome payloads are redacted
before persistence.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.redaction import redact_obj
from app.core.request_context import get_request_id
from app.db.models import AuditEvent, Workspace, WorkspaceMembership
from app.repositories import audit_events as audit_repository
from app.schemas.audit import AuditEventListResponse, AuditEventOut, AuditRetentionResponse

log = logging.getLogger("app")


def _system_workspace_id(db: Session) -> str:
    """Id of the memberless ``system`` workspace for account-level events.

    Nobody is a member, so its rows are unreachable through the workspace
    API; it exists only so the NOT NULL audit column can be satisfied for
    events that have neither a user nor a workspace.
    """
    existing = db.scalar(select(Workspace).where(Workspace.slug == "system"))
    if existing is not None:
        return existing.id
    workspace = Workspace(slug="system", name="System", settings={})
    db.add(workspace)
    db.commit()
    log.warning("audit: created the memberless 'system' workspace")
    return workspace.id


def _resolve_audit_workspace(
    db: Session, user_id: str | None, workspace_id: str | None
) -> str:
    if workspace_id:
        return workspace_id
    if user_id:
        membership = db.scalar(
            select(WorkspaceMembership)
            .where(WorkspaceMembership.user_id == user_id)
            .order_by(WorkspaceMembership.created_at)
        )
        if membership is not None:
            return membership.workspace_id
    return _system_workspace_id(db)


def record_event(
    db: Session,
    *,
    action: str,
    actor: str,
    decision: str,
    user_id: str | None = None,
    workspace_id: str | None = None,
    tenant_id: str = "default",
    resource: dict[str, Any] | None = None,
    reason: str | None = None,
    outcome: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> AuditEvent:
    """Record a redacted audit event in the acting workspace.

    Callers with a workspace context pass ``workspace_id`` explicitly so the
    event cannot be miscoped. Account-level events fall back to the actor's
    primary workspace; events with no user at all land in the memberless
    ``system`` workspace.
    """
    settings = get_settings()
    enabled = settings.redaction_enabled
    return audit_repository.record(
        db,
        workspace_id=_resolve_audit_workspace(db, user_id, workspace_id),
        user_id=user_id,
        action=action,
        actor=actor,
        decision=decision,
        resource=redact_obj(resource, enabled=enabled),
        reason=reason,
        outcome=redact_obj(outcome, enabled=enabled),
        request_id=request_id or get_request_id(),
    )


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
    workspace_id: str,
    user_id: str | None = None,
    action: str | None = None,
    actor: str | None = None,
    decision: str | None = None,
    before: datetime | None = None,
    after: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> AuditEventListResponse:
    rows, total = audit_repository.list_for_workspace(
        db,
        workspace_id=workspace_id,
        user_id=user_id,
        action=action,
        actor=actor,
        decision=decision,
        before=before,
        after=after,
        limit=limit,
        offset=offset,
    )
    return AuditEventListResponse(events=[_out(row) for row in rows], total=total)


def export_rows(
    db: Session,
    *,
    workspace_id: str,
    user_id: str | None = None,
    limit: int = 5000,
) -> list[AuditEventOut]:
    rows = audit_repository.rows_for_export(
        db, workspace_id=workspace_id, user_id=user_id, limit=limit
    )
    return [_out(row) for row in rows]


def apply_retention(
    db: Session, workspace_id: str, days: int
) -> AuditRetentionResponse:
    cutoff = datetime.now(UTC) - timedelta(days=max(1, days))
    deleted = audit_repository.delete_older_than(
        db, workspace_id=workspace_id, cutoff=cutoff
    )
    return AuditRetentionResponse(deleted=deleted, older_than_days=days)
