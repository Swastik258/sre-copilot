"""Workspace-scoped access to investigations."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Investigation


def list_for_workspace(
    db: Session,
    *,
    workspace_id: str,
    user_id: str | None = None,
    status: str | None = None,
    kind: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Investigation], int]:
    filters = [Investigation.workspace_id == workspace_id]
    if user_id is not None:
        filters.append(Investigation.user_id == user_id)
    if status is not None:
        filters.append(Investigation.status == status)
    if kind is not None:
        filters.append(Investigation.kind == kind)
    total = (
        db.scalar(select(func.count()).select_from(Investigation).where(*filters)) or 0
    )
    rows = list(
        db.scalars(
            select(Investigation)
            .where(*filters)
            .order_by(Investigation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    return rows, total


def get_for_workspace(
    db: Session, *, workspace_id: str, investigation_id: str
) -> Investigation | None:
    return db.scalar(
        select(Investigation).where(
            Investigation.id == investigation_id,
            Investigation.workspace_id == workspace_id,
        )
    )


def create(
    db: Session,
    *,
    workspace_id: str,
    user_id: str,
    title: str,
    kind: str,
    status: str = "open",
    result: dict[str, Any] | None = None,
) -> Investigation:
    row = Investigation(
        user_id=user_id,
        workspace_id=workspace_id,
        title=title,
        kind=kind,
        status=status,
        result=result if result is not None else {},
        evidence=[],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_status(
    db: Session, *, workspace_id: str, investigation_id: str, status: str
) -> Investigation | None:
    row = get_for_workspace(db, workspace_id=workspace_id, investigation_id=investigation_id)
    if row is None:
        return None
    row.status = status
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def append_result(
    db: Session, *, workspace_id: str, investigation_id: str, result: dict[str, Any]
) -> Investigation | None:
    row = get_for_workspace(db, workspace_id=workspace_id, investigation_id=investigation_id)
    if row is None:
        return None
    row.result = result
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
