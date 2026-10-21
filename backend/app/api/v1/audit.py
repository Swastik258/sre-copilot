"""Audit trail read, export, and retention endpoints.

Audit records are redacted before persistence. These routes never return
credentials. Members see their own events in their tenant; admins can inspect
across tenants, and only admins may apply retention.
"""

from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.api.deps import AdminUser, DbSession, RequiredUser
from app.schemas.audit import AuditEventListResponse, AuditRetentionResponse
from app.services import audit as service

router = APIRouter(prefix="/audit-events", tags=["audit"])


@router.get("", response_model=AuditEventListResponse)
def list_events(
    db: DbSession,
    user: RequiredUser,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    action: Annotated[str | None, Query(max_length=120)] = None,
    actor: Annotated[str | None, Query(max_length=80)] = None,
    decision: Annotated[str | None, Query(max_length=40)] = None,
    before: datetime | None = None,
    after: datetime | None = None,
) -> AuditEventListResponse:
    return service.list_events(
        db,
        user_id=None if user.role == "admin" else user.id,
        tenant_id=None if user.role == "admin" else user.tenant_id,
        action=action,
        actor=actor,
        decision=decision,
        before=before,
        after=after,
        limit=limit,
        offset=offset,
    )


@router.get("/export.csv")
def export_events(db: DbSession, user: RequiredUser) -> Response:
    rows = service.export_rows(
        db,
        user_id=None if user.role == "admin" else user.id,
        tenant_id=None if user.role == "admin" else user.tenant_id,
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


@router.delete("", response_model=AuditRetentionResponse)
def apply_retention(
    db: DbSession,
    user: AdminUser,
    older_than_days: Annotated[int, Query(ge=1, le=3650)] = 30,
) -> AuditRetentionResponse:
    result = service.apply_retention(db, older_than_days)
    service.record_event(
        db,
        action="audit.retention",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"older_than_days": older_than_days, "deleted": result.deleted},
    )
    return result
