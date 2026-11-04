"""Require workspace_id on every scoped table.

Revision ID: 0013_workspace_id_not_null
Revises: 0012_workspace_backfill
Create Date: 2026-11-04

Migration 0012 stamped workspace_id on every row attributable to a user.
Rows that cannot be attributed (for example an audit event with no user_id,
or a global integration row) are parked in a memberless quarantine workspace
so the NOT NULL constraint can be applied without deleting anything. Counts
are logged so operators can audit what was quarantined.
"""

import logging
import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

from alembic import op

log = logging.getLogger("alembic.runtime.migration")

revision: str = "0013_workspace_id_not_null"
down_revision: str | None = "0012_workspace_backfill"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TABLES = (
    "conversations",
    "messages",
    "integrations",
    "investigations",
    "evidence",
    "audit_events",
)


def _quarantine_workspace_id(bind) -> str:
    row = bind.execute(
        sa.text("SELECT id FROM workspaces WHERE slug = 'quarantine'")
    ).first()
    if row is not None:
        return row[0]
    workspace_id = str(uuid.uuid4())
    bind.execute(
        sa.text(
            "INSERT INTO workspaces "
            "(id, slug, name, settings, created_at, updated_at) "
            "VALUES (:id, 'quarantine', 'Quarantine', '{}', CURRENT_TIMESTAMP, "
            "CURRENT_TIMESTAMP)"
        ),
        {"id": workspace_id},
    )
    return workspace_id


def upgrade() -> None:
    bind = op.get_bind()
    workspace_id = _quarantine_workspace_id(bind)

    quarantined_total = 0
    for table in _TABLES:
        result = bind.execute(
            sa.text(f"UPDATE {table} SET workspace_id = :wid WHERE workspace_id IS NULL"),
            {"wid": workspace_id},
        )
        count = result.rowcount or 0
        if count:
            log.warning(
                "workspace isolation: quarantined %d unattributable row(s) in %s",
                count,
                table,
            )
            quarantined_total += count
    if quarantined_total:
        log.warning(
            "workspace isolation: quarantined %d row(s) total into the "
            "memberless 'quarantine' workspace",
            quarantined_total,
        )

    inspector = sa_inspect(bind)
    for table in _TABLES:
        columns = {column["name"]: column for column in inspector.get_columns(table)}
        column = columns.get("workspace_id")
        if column is None or not column["nullable"]:
            # Already NOT NULL (fresh database) — idempotent no-op.
            continue
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column(
                "workspace_id",
                existing_type=sa.String(length=36),
                nullable=False,
            )


def downgrade() -> None:
    for table in _TABLES:
        with op.batch_alter_table(table) as batch_op:
            batch_op.alter_column(
                "workspace_id",
                existing_type=sa.String(length=36),
                nullable=True,
            )
