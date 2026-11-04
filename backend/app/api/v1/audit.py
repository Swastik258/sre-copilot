"""Audit trail read, export, and retention endpoints.

Scoped routes live under ``/workspaces/{workspace_slug}/audit-events``. The
legacy unprefixed routes keep working only when the workspace resolves from
the ``X-Workspace-Id`` header or the user's single workspace, and log a
deprecation warning. Members and viewers see their own events; owners and
admins see all events in the workspace. Retention and exports never cross
the workspace boundary.
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response

from app.api.deps import (
    DbSession,
    RequiredUser,
    WorkspaceFromPath,
    WorkspaceFromRequest,
    require_workspace_permission,
)
from app.auth.permissions import has_permission
from app.schemas.audit import AuditEventListResponse, AuditRetentionResponse
from app.services import audit as service

log = logging.getLogger("app")

_DEPRECATION = (
    "Unprefixed /audit-events routes are deprecated; use "
    "/api/v1/workspaces/{workspace_slug}/audit-events."
)

router = APIRouter(prefix="/audit-events", tags=["audit"])
scoped_router = APIRouter(
    prefix="/workspaces/{workspace_slug}/audit-events", tags=["audit"]
)


def _list_response(
    db: DbSession,
    context_workspace_id: str,
    context_role: str,
    user: RequiredUser,
    *,
    limit: int,
    offset: int,
    action: str | None,
    actor: str | None,
    decision: str | None,
    before: datetime | None,
    after: datetime | None,
) -> AuditEventListResponse:
    can_read_all = has_permission(context_role, "audit.read_all")
    return service.list_events(
        db,
        workspace_id=context_workspace_id,
        user_id=None if can_read_all else user.id,
        action=action,
        actor=actor,
        decision=decision,
        before=before,
        after=after,
        limit=limit,
        offset=offset,
    )


def _csv_response(db: DbSession, workspace_id: str, user: RequiredUser, role: str) -> Response:
    can_read_all = has_permission(role, "audit.read_all")
    rows = service.export_rows(
        db,
        workspace_id=workspace_id,
        user_id=None if can_read_all else user.id,
        limit=10_000,
    )
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "created_at",
            "action",
            "actor",
            "decision",
            "user_id",
            "resource",
            "reason",
            "outcome",
            "request_id",
        ]
    )
    for event in rows:
        writer.writerow(
            [
                event.created_at.isoformat(),
                event.action,
                event.actor,
                event.decision,
                event.user_id or "",
                event.resource or "",
                event.reason or "",
                event.outcome or "",
                event.request_id or "",
            ]
        )
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="sre-copilot-audit.csv"'},
    )


@scoped_router.get(
    "",
    response_model=AuditEventListResponse,
    dependencies=[Depends(require_workspace_permission("audit.read"))],
)
def list_events_scoped(
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    action: Annotated[str | None, Query(max_length=120)] = None,
    actor: Annotated[str | None, Query(max_length=80)] = None,
    decision: Annotated[str | None, Query(max_length=40)] = None,
    before: datetime | None = None,
    after: datetime | None = None,
) -> AuditEventListResponse:
    return _list_response(
        db,
        context.workspace_id,
        context.role,
        user,
        limit=limit,
        offset=offset,
        action=action,
        actor=actor,
        decision=decision,
        before=before,
        after=after,
    )


@scoped_router.get(
    "/export.csv",
    dependencies=[Depends(require_workspace_permission("audit.export"))],
)
def export_events_scoped(
    context: WorkspaceFromPath, user: RequiredUser, db: DbSession
) -> Response:
    return _csv_response(db, context.workspace_id, user, context.role)


@scoped_router.delete(
    "",
    response_model=AuditRetentionResponse,
    dependencies=[Depends(require_workspace_permission("workspace.manage_settings"))],
)
def apply_retention_scoped(
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    older_than_days: Annotated[int, Query(ge=1, le=3650)] = 30,
) -> AuditRetentionResponse:
    result = service.apply_retention(
        db, context.workspace_id, older_than_days
    )
    service.record_event(
        db,
        action="audit.retention",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"older_than_days": older_than_days, "deleted": result.deleted},
    )
    return result


# ---- Legacy unprefixed routes (deprecated) ----


@router.get(
    "",
    response_model=AuditEventListResponse,
    dependencies=[Depends(require_workspace_permission("audit.read"))],
)
def list_events(
    context: WorkspaceFromRequest,
    user: RequiredUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    action: Annotated[str | None, Query(max_length=120)] = None,
    actor: Annotated[str | None, Query(max_length=80)] = None,
    decision: Annotated[str | None, Query(max_length=40)] = None,
    before: datetime | None = None,
    after: datetime | None = None,
) -> AuditEventListResponse:
    log.warning(_DEPRECATION)
    return _list_response(
        db,
        context.workspace_id,
        context.role,
        user,
        limit=limit,
        offset=offset,
        action=action,
        actor=actor,
        decision=decision,
        before=before,
        after=after,
    )


@router.get(
    "/export.csv",
    dependencies=[Depends(require_workspace_permission("audit.export"))],
)
def export_events(
    context: WorkspaceFromRequest, user: RequiredUser, db: DbSession
) -> Response:
    log.warning(_DEPRECATION)
    return _csv_response(db, context.workspace_id, user, context.role)


@router.delete(
    "",
    response_model=AuditRetentionResponse,
    dependencies=[Depends(require_workspace_permission("workspace.manage_settings"))],
)
def apply_retention(
    context: WorkspaceFromRequest,
    user: RequiredUser,
    db: DbSession,
    older_than_days: Annotated[int, Query(ge=1, le=3650)] = 30,
) -> AuditRetentionResponse:
    log.warning(_DEPRECATION)
    result = service.apply_retention(db, context.workspace_id, older_than_days)
    service.record_event(
        db,
        action="audit.retention",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"older_than_days": older_than_days, "deleted": result.deleted},
    )
    return result
