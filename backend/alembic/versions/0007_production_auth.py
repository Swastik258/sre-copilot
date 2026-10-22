"""Organizations, memberships, account lockout, sessions, email tokens.

Revision ID: 0007_production_auth
Revises: 0006_customer_account

Existing accounts are backfilled into one organization per distinct tenant. The
first administrator in each tenant becomes the owner membership (the user's
denormalized role is left intact for backward compatibility); everyone else
keeps a member membership. Existing accounts are treated as email-verified so a
deployment enabling verification does not lock out current users.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0007_production_auth"
down_revision: str | None = "0006_customer_account"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ---- User lifecycle / lockout columns ----
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "failed_login_count", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.add_column(
        "users",
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ---- Session rotation / CSRF columns ----
    op.add_column(
        "sessions", sa.Column("csrf_token_hash", sa.String(length=64), nullable=True)
    )
    op.add_column(
        "sessions",
        sa.Column("rotated_from_id", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "sessions", sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True)
    )

    # ---- Organizations and memberships ----
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=True),
        sa.Column(
            "plan_id", sa.String(length=32), nullable=False, server_default="free"
        ),
        sa.Column("created_by", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_table(
        "organization_memberships",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column(
            "role", sa.String(length=16), nullable=False, server_default="member"
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_organization_memberships_organization_id",
        "organization_memberships",
        ["organization_id"],
    )
    op.create_index(
        "ix_organization_memberships_user_id",
        "organization_memberships",
        ["user_id"],
    )
    op.create_index(
        "ix_organization_memberships_org_user",
        "organization_memberships",
        ["organization_id", "user_id"],
        unique=True,
    )
    op.create_index(
        "ix_organization_memberships_user_role",
        "organization_memberships",
        ["user_id", "role"],
    )

    # ---- Single-use email tokens ----
    op.create_table(
        "email_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_email_tokens_user_id", "email_tokens", ["user_id"])
    op.create_index("ix_email_tokens_purpose", "email_tokens", ["purpose"])
    op.create_index("ix_email_tokens_token_hash", "email_tokens", ["token_hash"], unique=True)
    op.create_index(
        "ix_email_tokens_user_purpose",
        "email_tokens",
        ["user_id", "purpose", "created_at"],
    )
    op.create_index(
        "ix_sessions_user_last_used", "sessions", ["user_id", "last_used_at"]
    )

    bind = op.get_bind()
    bind.execute(
        sa.text(
            "UPDATE users SET email_verified_at = created_at "
            "WHERE email_verified_at IS NULL"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE sessions SET last_used_at = created_at "
            "WHERE last_used_at IS NULL"
        )
    )

    # ---- Backfill organizations/memberships ----
    tenants = bind.execute(
        sa.text("SELECT DISTINCT tenant_id FROM users ORDER BY tenant_id")
    ).scalars().all()
    for index, tenant_id in enumerate(tenants):
        tenant = (tenant_id or "default")[:36]
        users = bind.execute(
            sa.text(
                "SELECT id, role FROM users WHERE tenant_id = :tenant "
                "ORDER BY created_at, id"
            ),
            {"tenant": tenant},
        ).all()
        if not users:
            continue
        first_user_id = users[0][0]
        org_id = tenant
        existing = bind.execute(
            sa.text("SELECT id FROM organizations WHERE id = :id"), {"id": org_id}
        ).first()
        if existing is None:
            bind.execute(
                sa.text(
                    "INSERT INTO organizations "
                    "(id, name, slug, plan_id, created_by, created_at, updated_at) "
                    "VALUES (:id, :name, :slug, 'free', :created_by, "
                    "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
                ),
                {
                    "id": org_id,
                    "name": "Default workspace" if tenant == "default" else f"Workspace {tenant}"[:120],
                    "slug": "default" if tenant == "default" else f"workspace-{index + 1}",
                    "created_by": first_user_id,
                },
            )
        owner_assigned = False
        for user_id, role in users:
            membership_role = "member"
            if role == "admin" and not owner_assigned:
                membership_role = "owner"
                owner_assigned = True
            elif role == "admin":
                membership_role = "admin"
            membership_id = f"m-{tenant}-{user_id}"[:36]
            # String IDs above can collide when truncated for long tenants; use
            # a deterministic hash-safe fallback for the rare overflow case.
            if len(f"m-{tenant}-{user_id}") > 36:
                import hashlib

                membership_id = hashlib.sha1(
                    f"{tenant}:{user_id}".encode()
                ).hexdigest()[:36]
            already = bind.execute(
                sa.text(
                    "SELECT id FROM organization_memberships "
                    "WHERE organization_id = :org AND user_id = :user"
                ),
                {"org": org_id, "user": user_id},
            ).first()
            if already is None:
                bind.execute(
                    sa.text(
                        "INSERT INTO organization_memberships "
                        "(id, organization_id, user_id, role, created_at, updated_at) "
                        "VALUES (:id, :org, :user, :role, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
                    ),
                    {
                        "id": membership_id,
                        "org": org_id,
                        "user": user_id,
                        "role": membership_role,
                    },
                )


def downgrade() -> None:
    op.drop_index("ix_sessions_user_last_used", table_name="sessions")
    op.drop_index("ix_email_tokens_user_purpose", table_name="email_tokens")
    op.drop_index("ix_email_tokens_token_hash", table_name="email_tokens")
    op.drop_index("ix_email_tokens_purpose", table_name="email_tokens")
    op.drop_index("ix_email_tokens_user_id", table_name="email_tokens")
    op.drop_table("email_tokens")
    op.drop_index(
        "ix_organization_memberships_user_role",
        table_name="organization_memberships",
    )
    op.drop_index(
        "ix_organization_memberships_org_user",
        table_name="organization_memberships",
    )
    op.drop_index(
        "ix_organization_memberships_user_id",
        table_name="organization_memberships",
    )
    op.drop_index(
        "ix_organization_memberships_organization_id",
        table_name="organization_memberships",
    )
    op.drop_table("organization_memberships")
    op.drop_table("organizations")
    op.drop_column("sessions", "last_used_at")
    op.drop_column("sessions", "rotated_from_id")
    op.drop_column("sessions", "csrf_token_hash")
    op.drop_column("users", "password_changed_at")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_count")
    op.drop_column("users", "email_verified_at")
