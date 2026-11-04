"""Workspace-scoped access to evidence rows."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Evidence


def list_for_investigation(
    db: Session, *, workspace_id: str, investigation_id: str, limit: int = 50
) -> list[Evidence]:
    return list(
        db.scalars(
            select(Evidence)
            .where(
                Evidence.workspace_id == workspace_id,
                Evidence.investigation_id == investigation_id,
            )
            .order_by(Evidence.collected_at)
            .limit(limit)
        )
    )


def ids_for_investigation(
    db: Session, *, workspace_id: str, investigation_id: str
) -> list[str]:
    return list(
        db.scalars(
            select(Evidence.id)
            .where(
                Evidence.workspace_id == workspace_id,
                Evidence.investigation_id == investigation_id,
            )
            .order_by(Evidence.collected_at)
        )
    )


def create(
    db: Session,
    *,
    workspace_id: str,
    investigation_id: str | None,
    source_type: str,
    summary: str,
    severity: str = "info",
    source_resource: str | None = None,
    environment: str | None = None,
    payload: dict[str, Any] | None = None,
    provenance: str | None = None,
    related_ids: list[str] | None = None,
    integrity: str | None = None,
    redacted: bool = True,
    demo: bool = False,
    event_timestamp: datetime | None = None,
) -> Evidence:
    row = Evidence(
        workspace_id=workspace_id,
        investigation_id=investigation_id,
        source_type=source_type,
        source_resource=source_resource,
        environment=environment,
        severity=severity,
        summary=summary,
        payload=payload,
        provenance=provenance,
        related_ids=related_ids,
        integrity=integrity,
        redacted=redacted,
        demo=demo,
        event_timestamp=event_timestamp,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
