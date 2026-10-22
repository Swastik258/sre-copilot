"""Require a last-used timestamp on auth sessions.

The production-auth migration backfilled existing rows but left the column
nullable. The application always writes it, so tighten the schema to match.

Revision ID: 0010_session_last_used_not_null
Revises: 0009_jobs_idempotency
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0010_session_last_used_not_null"
down_revision: str | None = "0009_jobs_idempotency"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(sa.text("UPDATE sessions SET last_used_at = created_at WHERE last_used_at IS NULL"))
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.alter_column(
            "last_used_at",
            existing_type=sa.DateTime(timezone=True),
            nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.alter_column(
            "last_used_at",
            existing_type=sa.DateTime(timezone=True),
            nullable=True,
        )
