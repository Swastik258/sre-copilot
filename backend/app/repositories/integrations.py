"""Workspace-scoped access to integrations."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Integration


def list_for_workspace(
    db: Session, *, workspace_id: str, kind: str | None = None
) -> list[Integration]:
    filters = [Integration.workspace_id == workspace_id]
    if kind is not None:
        filters.append(Integration.kind == kind)
    return list(db.scalars(select(Integration).where(*filters).order_by(Integration.name)))


def get_for_workspace(
    db: Session, *, workspace_id: str, integration_id: str
) -> Integration | None:
    return db.scalar(
        select(Integration).where(
            Integration.id == integration_id,
            Integration.workspace_id == workspace_id,
        )
    )


def create(
    db: Session,
    *,
    workspace_id: str,
    kind: str,
    name: str,
    enabled: bool = False,
    config: dict[str, Any] | None = None,
) -> Integration:
    row = Integration(
        workspace_id=workspace_id, kind=kind, name=name, enabled=enabled, config=config
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update(
    db: Session,
    *,
    workspace_id: str,
    integration_id: str,
    name: str | None = None,
    enabled: bool | None = None,
    config: dict[str, Any] | None = None,
) -> Integration | None:
    row = get_for_workspace(db, workspace_id=workspace_id, integration_id=integration_id)
    if row is None:
        return None
    if name is not None:
        row.name = name
    if enabled is not None:
        row.enabled = enabled
    if config is not None:
        row.config = config
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete(db: Session, *, workspace_id: str, integration_id: str) -> bool:
    row = get_for_workspace(db, workspace_id=workspace_id, integration_id=integration_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True
