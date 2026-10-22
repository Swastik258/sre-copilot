"""Add per-user account settings and revocable API keys.

Revision ID: 0006_customer_account
Revises: 0005_roles_tenants
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006_customer_account"
down_revision: str | None = "0005_roles_tenants"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "account_settings",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("preferences", sa.JSON(), nullable=False),
        sa.Column("integrations", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_table(
        "user_api_keys",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("prefix", sa.String(length=24), nullable=False),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash"),
    )
    op.create_index("ix_user_api_keys_user_id", "user_api_keys", ["user_id"])
    op.create_index("ix_user_api_keys_key_hash", "user_api_keys", ["key_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_api_keys_key_hash", table_name="user_api_keys")
    op.drop_index("ix_user_api_keys_user_id", table_name="user_api_keys")
    op.drop_table("user_api_keys")
    op.drop_table("account_settings")
