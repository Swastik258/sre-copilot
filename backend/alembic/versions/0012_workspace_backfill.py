"""Backfill workspaces for existing users.

Revision ID: 0012_workspace_backfill
Revises: 0011_workspace_isolation
Create Date: 2026-11-04

For every existing user without a workspace this creates one personal
workspace (slug derived from name or email local part, numeric suffix on
collision), adds the user as owner, and stamps workspace_id on every row they
own: directly via user_id, via the parent conversation for messages, and via
the parent investigation for evidence. Rows that cannot be attributed to any
user are left NULL here; migration 0013 parks them in a memberless quarantine
workspace. Copy-only, non-destructive, safe to run twice.
"""

import json
import re
import uuid
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0012_workspace_backfill"
down_revision: str | None = "0011_workspace_isolation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Tables whose rows are attributable to a user via a user_id column.
# integrations and evidence have no user_id and are handled via the
# quarantine path in 0013 (evidence also via its parent investigation here).
_DIRECT_TABLES = ("conversations", "investigations")


def _base_slug(display_name: str | None, email: str | None) -> str:
    raw = display_name if display_name else (email.split("@", 1)[0] if email else None)
    slug = re.sub(r"[^a-z0-9]+", "-", (raw or "user").lower()).strip("-")
    return slug or "user"


def _unique_slug(existing: set[str], base: str) -> str:
    if base not in existing:
        return base
    counter = 2
    while f"{base}-{counter}" in existing:
        counter += 1
    return f"{base}-{counter}"


def upgrade() -> None:
    bind = op.get_bind()

    existing_slugs = set(
        bind.execute(sa.text("SELECT slug FROM workspaces")).scalars().all()
    )
    membered = {
        row[0]
        for row in bind.execute(sa.text("SELECT user_id FROM workspace_members")).all()
    }

    users = bind.execute(
        sa.text("SELECT id, display_name, email FROM users ORDER BY created_at, id")
    ).all()

    user_workspace: dict[str, str] = {}
    for user_id, display_name, email in users:
        if user_id in membered:
            continue
        slug = _unique_slug(existing_slugs, _base_slug(display_name, email))
        workspace_id = str(uuid.uuid4())
        bind.execute(
            sa.text(
                "INSERT INTO workspaces "
                "(id, slug, name, settings, created_at, updated_at) "
                "VALUES (:id, :slug, :name, :settings, CURRENT_TIMESTAMP, "
                "CURRENT_TIMESTAMP)"
            ),
            {
                "id": workspace_id,
                "slug": slug,
                "name": display_name or email or f"Workspace {slug}",
                "settings": json.dumps({}),
            },
        )
        bind.execute(
            sa.text(
                "INSERT INTO workspace_members "
                "(id, workspace_id, user_id, role, created_at, updated_at) "
                "VALUES (:id, :wid, :uid, 'owner', CURRENT_TIMESTAMP, "
                "CURRENT_TIMESTAMP)"
            ),
            {"id": str(uuid.uuid4()), "wid": workspace_id, "uid": user_id},
        )
        existing_slugs.add(slug)
        user_workspace[user_id] = workspace_id

    if not user_workspace:
        return

    for table in _DIRECT_TABLES:
        for user_id, workspace_id in user_workspace.items():
            bind.execute(
                sa.text(
                    f"UPDATE {table} SET workspace_id = :wid "
                    "WHERE user_id = :uid AND workspace_id IS NULL"
                ),
                {"wid": workspace_id, "uid": user_id},
            )

    # Messages and evidence inherit the workspace of their parent row.
    bind.execute(
        sa.text(
            "UPDATE messages SET workspace_id = "
            "(SELECT c.workspace_id FROM conversations c "
            "WHERE c.id = messages.conversation_id) "
            "WHERE workspace_id IS NULL "
            "AND conversation_id IN (SELECT id FROM conversations)"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE evidence SET workspace_id = "
            "(SELECT i.workspace_id FROM investigations i "
            "WHERE i.id = evidence.investigation_id) "
            "WHERE workspace_id IS NULL "
            "AND investigation_id IN (SELECT id FROM investigations)"
        )
    )

    for user_id, workspace_id in user_workspace.items():
        bind.execute(
            sa.text(
                "UPDATE audit_events SET workspace_id = :wid "
                "WHERE user_id = :uid AND workspace_id IS NULL"
            ),
            {"wid": workspace_id, "uid": user_id},
        )


def downgrade() -> None:
    # Backfill is copy-only; there is nothing to undo.
    pass
