"""Add workspace roles and tenant boundaries.

Revision ID: 0005_roles_tenants
Revises: 0004_app_settings
Create Date: 2026-10-21
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_roles_tenants"
down_revision: str | None = "0004_app_settings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=16), nullable=False, server_default="member"),
    )
    op.add_column(
        "users",
        sa.Column("tenant_id", sa.String(length=36), nullable=False, server_default="default"),
    )
    op.add_column(
        "investigations",
        sa.Column("tenant_id", sa.String(length=36), nullable=False, server_default="default"),
    )
    op.add_column(
        "audit_events",
        sa.Column("tenant_id", sa.String(length=36), nullable=False, server_default="default"),
    )
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])
    op.create_index("ix_users_tenant_role", "users", ["tenant_id", "role"])
    op.create_index("ix_investigations_tenant_id", "investigations", ["tenant_id"])
    op.create_index(
        "ix_investigations_tenant_created",
        "investigations",
        ["tenant_id", "created_at"],
    )
    op.create_index("ix_audit_events_tenant_id", "audit_events", ["tenant_id"])
    op.create_index(
        "ix_audit_events_tenant_created",
        "audit_events",
        ["tenant_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_audit_events_tenant_created", table_name="audit_events")
    op.drop_index("ix_audit_events_tenant_id", table_name="audit_events")
    op.drop_index("ix_investigations_tenant_created", table_name="investigations")
    op.drop_index("ix_investigations_tenant_id", table_name="investigations")
    op.drop_index("ix_users_tenant_role", table_name="users")
    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("audit_events", "tenant_id")
    op.drop_column("investigations", "tenant_id")
    op.drop_column("users", "tenant_id")
    op.drop_column("users", "role")
