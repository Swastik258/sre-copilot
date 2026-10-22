"""Plan billing state, usage metering, and Stripe webhook storage.

Revision ID: 0008_billing_usage
Revises: 0007_production_auth
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008_billing_usage"
down_revision: str | None = "0007_production_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column(
            "provider", sa.String(length=32), nullable=False, server_default="stripe"
        ),
        sa.Column("provider_customer_id", sa.String(length=255), nullable=True),
        sa.Column("provider_subscription_id", sa.String(length=255), nullable=True),
        sa.Column(
            "plan_id", sa.String(length=32), nullable=False, server_default="free"
        ),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="inactive"
        ),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "cancel_at_period_end",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id"),
        sa.UniqueConstraint("provider_subscription_id"),
    )
    op.create_index(
        "ix_subscriptions_organization_id",
        "subscriptions",
        ["organization_id"],
        unique=True,
    )

    op.create_table(
        "usage_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("metric", sa.String(length=64), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("properties", sa.JSON(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index(
        "ix_usage_events_organization_id", "usage_events", ["organization_id"]
    )
    op.create_index("ix_usage_events_user_id", "usage_events", ["user_id"])
    op.create_index("ix_usage_events_metric", "usage_events", ["metric"])
    op.create_index(
        "ix_usage_events_org_occurred",
        "usage_events",
        ["organization_id", "occurred_at"],
    )
    op.create_index(
        "ix_usage_events_org_metric",
        "usage_events",
        ["organization_id", "metric"],
    )

    op.create_table(
        "billing_webhook_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "provider", sa.String(length=32), nullable=False, server_default="stripe"
        ),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column(
            "status", sa.String(length=32), nullable=False, server_default="received"
        ),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id"),
    )
    op.create_index(
        "ix_billing_webhook_events_event_id",
        "billing_webhook_events",
        ["event_id"],
        unique=True,
    )
    op.create_index(
        "ix_billing_webhook_events_provider_received",
        "billing_webhook_events",
        ["provider", "received_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_billing_webhook_events_provider_received",
        table_name="billing_webhook_events",
    )
    op.drop_index(
        "ix_billing_webhook_events_event_id", table_name="billing_webhook_events"
    )
    op.drop_table("billing_webhook_events")
    op.drop_index("ix_usage_events_org_metric", table_name="usage_events")
    op.drop_index("ix_usage_events_org_occurred", table_name="usage_events")
    op.drop_index("ix_usage_events_metric", table_name="usage_events")
    op.drop_index("ix_usage_events_user_id", table_name="usage_events")
    op.drop_index("ix_usage_events_organization_id", table_name="usage_events")
    op.drop_table("usage_events")
    op.drop_index("ix_subscriptions_organization_id", table_name="subscriptions")
    op.drop_table("subscriptions")
