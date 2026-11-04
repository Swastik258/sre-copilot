"""Add workspaces, workspace_members and workspace_invites.

Revision ID: 0011_workspace_isolation
Revises: 0010_session_last_used_not_null
Create Date: 2026-11-04
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0011_workspace_isolation"
down_revision: str | None = "0010_session_last_used_not_null"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("settings", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_table(
        "workspace_members",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "workspace_id",
            sa.String(length=36),
            nullable=False,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
        ),
        sa.Column(
            "user_id",
            sa.String(length=36),
            nullable=False,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
        ),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "user_id"),
        sa.CheckConstraint(
            "role IN ('owner', 'admin', 'member', 'viewer')",
            name="ck_workspace_members_role",
        ),
    )
    op.create_table(
        "workspace_invites",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "workspace_id",
            sa.String(length=36),
            nullable=False,
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
        ),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "invited_by",
            sa.String(length=36),
            nullable=False,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table("conversations") as batch_op:
        batch_op.add_column(sa.Column("workspace_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            "fk_conversations_workspace",
            "conversations",
            "workspaces",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )
    op.create_index("ix_conversations_workspace_id", "conversations", ["workspace_id"])

    with op.batch_alter_table("messages") as batch_op:
        batch_op.add_column(sa.Column("workspace_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            "fk_messages_workspace",
            "messages",
            "workspaces",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )
    op.create_index("ix_messages_workspace_id", "messages", ["workspace_id"])

    with op.batch_alter_table("integrations") as batch_op:
        batch_op.add_column(sa.Column("workspace_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            "fk_integrations_workspace",
            "integrations",
            "workspaces",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )
    op.create_index("ix_integrations_workspace_id", "integrations", ["workspace_id"])

    with op.batch_alter_table("investigations") as batch_op:
        batch_op.add_column(sa.Column("workspace_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            "fk_investigations_workspace",
            "investigations",
            "workspaces",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )
    op.create_index("ix_investigations_workspace_id", "investigations", ["workspace_id"])

    with op.batch_alter_table("evidence") as batch_op:
        batch_op.add_column(sa.Column("workspace_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            "fk_evidence_workspace",
            "evidence",
            "workspaces",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )
    op.create_index("ix_evidence_workspace_id", "evidence", ["workspace_id"])

    with op.batch_alter_table("audit_events") as batch_op:
        batch_op.add_column(sa.Column("workspace_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            "fk_audit_events_workspace",
            "audit_events",
            "workspaces",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )
    op.create_index("ix_audit_events_workspace_id", "audit_events", ["workspace_id"])


def downgrade() -> None:
    with op.batch_alter_table("audit_events") as batch_op:
        batch_op.drop_constraint("fk_audit_events_workspace", type_="foreignkey")
        batch_op.drop_column("workspace_id")
    with op.batch_alter_table("evidence") as batch_op:
        batch_op.drop_constraint("fk_evidence_workspace", type_="foreignkey")
        batch_op.drop_column("workspace_id")
    with op.batch_alter_table("investigations") as batch_op:
        batch_op.drop_constraint("fk_investigations_workspace", type_="foreignkey")
        batch_op.drop_column("workspace_id")
    with op.batch_alter_table("integrations") as batch_op:
        batch_op.drop_constraint("fk_integrations_workspace", type_="foreignkey")
        batch_op.drop_column("workspace_id")
    with op.batch_alter_table("messages") as batch_op:
        batch_op.drop_constraint("fk_messages_workspace", type_="foreignkey")
        batch_op.drop_column("workspace_id")
    with op.batch_alter_table("conversations") as batch_op:
        batch_op.drop_constraint("fk_conversations_workspace", type_="foreignkey")
        batch_op.drop_column("workspace_id")

    op.drop_table("workspace_invites")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
