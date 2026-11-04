"""Additive, local-only SQLite schema upgrades.

``Base.metadata.create_all()`` creates missing tables but never alters an
existing one. A local database created before a column was added therefore
keeps the old shape and fails at query time — for example, a pre-auth
``sre_copilot.db`` has a ``users`` table without ``password_hash``, so signup
fails with ``no such column: users.password_hash``.

Deployments use Alembic. This module only closes that gap for the zero-setup
local SQLite demo. It adds missing columns/indexes and, when roles are first
introduced, leaves accounts as members. Administrator privileges must be
granted explicitly by a trusted operator.
"""

from __future__ import annotations

import json
import logging
import re
import uuid

import sqlalchemy as sa
from sqlalchemy import Engine

_SCOPED_TABLES = (
    "conversations",
    "messages",
    "integrations",
    "investigations",
    "evidence",
    "audit_events",
)

log = logging.getLogger("app")

_AUTH_COLUMN = "password_hash"
_EMAIL_INDEX = "ix_users_email"


def upgrade_local_sqlite_schema(engine: Engine) -> list[str]:
    """Apply additive auth-schema upgrades to a local SQLite database.

    Returns the changes applied so the caller can log them. Calling this on an
    up-to-date schema is a no-op.
    """

    applied: list[str] = []

    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.exec_driver_sql("SELECT name FROM sqlite_master WHERE type='table'")
        }
        if "users" not in tables:
            return applied

        columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)")}
        if _AUTH_COLUMN not in columns:
            conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {_AUTH_COLUMN} VARCHAR(255)")
            applied.append(f"users.{_AUTH_COLUMN}")

        # Role and tenant columns are additive with safe defaults. This keeps a
        # pre-tenancy local database usable without deleting its data.
        for table, column, ddl in (
            ("users", "role", "VARCHAR(16) NOT NULL DEFAULT 'member'"),
            ("users", "tenant_id", "VARCHAR(36) NOT NULL DEFAULT 'default'"),
            ("users", "email_verified_at", "DATETIME"),
            ("users", "failed_login_count", "INTEGER NOT NULL DEFAULT 0"),
            ("users", "locked_until", "DATETIME"),
            ("users", "password_changed_at", "DATETIME"),
            ("sessions", "csrf_token_hash", "VARCHAR(64)"),
            ("sessions", "rotated_from_id", "VARCHAR(36)"),
            ("sessions", "last_used_at", "DATETIME"),
            ("investigations", "tenant_id", "VARCHAR(36) NOT NULL DEFAULT 'default'"),
            ("audit_events", "tenant_id", "VARCHAR(36) NOT NULL DEFAULT 'default'"),
        ):
            if table not in tables:
                continue
            existing = {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")}
            if column not in existing:
                conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")
                applied.append(f"{table}.{column}")

    applied.extend(_mirror_workspaces(engine))

    # Index creation gets its own transaction: legacy rows may contain duplicate
    # non-null emails, and a failed statement must not poison the earlier work.
    with engine.begin() as conn:
        indexes = {row[1] for row in conn.exec_driver_sql("PRAGMA index_list(users)")}
        if _EMAIL_INDEX not in indexes:
            try:
                conn.exec_driver_sql(f"CREATE UNIQUE INDEX {_EMAIL_INDEX} ON users (email)")
                applied.append(_EMAIL_INDEX)
            except Exception:
                log.warning(
                    "Could not create a unique index on users.email: the local "
                    "database contains duplicate non-null emails. Remove the "
                    "duplicates, or delete the local SQLite file, then restart."
                )

    return applied


_WORKSPACE_TABLES = (
    (
        "workspaces",
        "CREATE TABLE IF NOT EXISTS workspaces ("
        "id VARCHAR(36) PRIMARY KEY, "
        "slug VARCHAR(80) NOT NULL UNIQUE, "
        "name VARCHAR(120) NOT NULL, "
        "settings TEXT NOT NULL, "
        "created_at DATETIME NOT NULL, "
        "updated_at DATETIME NOT NULL)",
    ),
    (
        "workspace_members",
        "CREATE TABLE IF NOT EXISTS workspace_members ("
        "id VARCHAR(36) PRIMARY KEY, "
        "workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, "
        "user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE, "
        "role VARCHAR(16) NOT NULL, "
        "created_at DATETIME NOT NULL, "
        "updated_at DATETIME NOT NULL, "
        "UNIQUE (workspace_id, user_id), "
        "CHECK (role IN ('owner', 'admin', 'member', 'viewer')))",
    ),
    (
        "workspace_invites",
        "CREATE TABLE IF NOT EXISTS workspace_invites ("
        "id VARCHAR(36) PRIMARY KEY, "
        "workspace_id VARCHAR(36) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, "
        "email VARCHAR(320) NOT NULL, "
        "role VARCHAR(16) NOT NULL, "
        "token_hash VARCHAR(64) NOT NULL UNIQUE, "
        "invited_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE, "
        "expires_at DATETIME NOT NULL, "
        "accepted_at DATETIME, "
        "created_at DATETIME NOT NULL)",
    ),
)


def _slug_base(display_name: str | None, email: str | None) -> str:
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


def _mirror_workspaces(engine: Engine) -> list[str]:
    """Mirror migrations 0011-0013 for a stale local SQLite database.

    Creates the workspace tables, adds a nullable workspace_id to every scoped
    table, backfills one personal workspace per user and repoints the rows
    they own (messages and evidence inherit from their parent row), parks any
    unattributable rows in a memberless quarantine workspace, and finally
    enforces NOT NULL via a batch table recreate. Calling twice is a no-op.
    """
    applied: list[str] = []
    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        if "users" not in tables:
            return applied

        for name, ddl in _WORKSPACE_TABLES:
            if name not in tables:
                conn.exec_driver_sql(ddl)
                applied.append(name)

        user_columns = {
            row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)")
        }
        name_expr = "display_name" if "display_name" in user_columns else "NULL"
        order_expr = "created_at, id" if "created_at" in user_columns else "id"

        scoped_missing: list[str] = []
        for table in _SCOPED_TABLES:
            if table not in tables:
                continue
            columns = {
                row[1]
                for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")
            }
            if "workspace_id" not in columns:
                scoped_missing.append(table)

        if scoped_missing:
            for table in scoped_missing:
                conn.exec_driver_sql(
                    f"ALTER TABLE {table} ADD COLUMN workspace_id VARCHAR(36)"
                )
                applied.append(f"{table}.workspace_id")

        existing_slugs = {
            row[0] for row in conn.exec_driver_sql("SELECT slug FROM workspaces")
        }
        membered = {
            row[0]
            for row in conn.exec_driver_sql("SELECT user_id FROM workspace_members")
        }
        users = conn.exec_driver_sql(
            f"SELECT id, {name_expr}, email FROM users ORDER BY {order_expr}"
        ).all()

        for user_id, display_name, email in users:
            if user_id in membered:
                continue
            slug = _unique_slug(existing_slugs, _slug_base(display_name, email))
            workspace_id = str(uuid.uuid4())
            conn.exec_driver_sql(
                "INSERT INTO workspaces (id, slug, name, settings, created_at, "
                "updated_at) VALUES (?, ?, ?, '{}', CURRENT_TIMESTAMP, "
                "CURRENT_TIMESTAMP)",
                (workspace_id, slug, display_name or email or f"Workspace {slug}"),
            )
            conn.exec_driver_sql(
                "INSERT INTO workspace_members (id, workspace_id, user_id, role, "
                "created_at, updated_at) VALUES (?, ?, ?, 'owner', "
                "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                (str(uuid.uuid4()), workspace_id, user_id),
            )
            existing_slugs.add(slug)
            membered.add(user_id)
            applied.append(f"workspace:{slug}")

            for table in ("conversations", "investigations"):
                if table in tables:
                    conn.exec_driver_sql(
                        f"UPDATE {table} SET workspace_id = ? "
                        "WHERE user_id = ? AND workspace_id IS NULL",
                        (workspace_id, user_id),
                    )
            if "audit_events" in tables:
                conn.exec_driver_sql(
                    "UPDATE audit_events SET workspace_id = ? "
                    "WHERE user_id = ? AND workspace_id IS NULL",
                    (workspace_id, user_id),
                )

        if {"messages", "conversations"} <= tables:
            conn.exec_driver_sql(
                "UPDATE messages SET workspace_id = "
                "(SELECT c.workspace_id FROM conversations c "
                "WHERE c.id = messages.conversation_id) "
                "WHERE workspace_id IS NULL "
                "AND conversation_id IN (SELECT id FROM conversations)"
            )
        if {"evidence", "investigations"} <= tables:
            conn.exec_driver_sql(
                "UPDATE evidence SET workspace_id = "
                "(SELECT i.workspace_id FROM investigations i "
                "WHERE i.id = evidence.investigation_id) "
                "WHERE workspace_id IS NULL "
                "AND investigation_id IN (SELECT id FROM investigations)"
            )

        needs_not_null: list[str] = []
        for table in _SCOPED_TABLES:
            if table not in tables:
                continue
            for row in conn.exec_driver_sql(f"PRAGMA table_info({table})"):
                if row[1] == "workspace_id" and not row[3]:
                    needs_not_null.append(table)
                    break

        if needs_not_null:
            quarantine = conn.exec_driver_sql(
                "SELECT id FROM workspaces WHERE slug = 'quarantine'"
            ).first()
            if quarantine is None:
                quarantine_id = str(uuid.uuid4())
                conn.exec_driver_sql(
                    "INSERT INTO workspaces (id, slug, name, settings, created_at, "
                    "updated_at) VALUES (?, 'quarantine', 'Quarantine', '{}', "
                    "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                    (quarantine_id,),
                )
            else:
                quarantine_id = quarantine[0]
            for table in needs_not_null:
                result = conn.exec_driver_sql(
                    f"UPDATE {table} SET workspace_id = ? WHERE workspace_id IS NULL",
                    (quarantine_id,),
                )
                parked = result.rowcount or 0
                if parked:
                    log.warning(
                        "workspace isolation: quarantined %d unattributable "
                        "row(s) in %s",
                        parked,
                        table,
                    )
            for table in needs_not_null:
                _batch_alter_workspace_not_null(conn, table)
                applied.append(f"{table}.workspace_id NOT NULL")

    return applied


def _batch_alter_workspace_not_null(conn, table: str) -> None:
    """Recreate a SQLite table with workspace_id NOT NULL (batch alter).

    SQLite cannot ALTER an existing column to NOT NULL. The replacement table
    is built from the authoritative SQLAlchemy models, so the recreated shape
    always matches the current schema. Incoming foreign keys survive the swap
    because SQLite resolves them by table name and the replacement takes the
    original name back (PRAGMA foreign_keys is off during local upgrades).
    """
    from app.db import models  # noqa: PLC0415 (local import avoids a cycle)

    model_table = models.Base.metadata.tables[table]
    indexes = sa.inspect(conn).get_indexes(table)

    spec = model_table.tometadata(sa.MetaData())
    spec.name = f"_batch_{table}"
    # Indexes are recreated from reflection after the swap so their names do
    # not collide with the ones still attached to the old table.
    spec.indexes.clear()
    spec.create(conn)

    column_names = ", ".join(f'"{column.name}"' for column in spec.columns)
    conn.exec_driver_sql(
        f'INSERT INTO "_batch_{table}" ({column_names}) '
        f'SELECT {column_names} FROM "{table}"'
    )
    conn.exec_driver_sql(f'DROP TABLE "{table}"')
    conn.exec_driver_sql(f'ALTER TABLE "_batch_{table}" RENAME TO "{table}"')

    for index in indexes:
        unique = "UNIQUE " if index.get("unique") else ""
        column_list = ", ".join(f'"{name}"' for name in index["column_names"])
        conn.exec_driver_sql(
            f'CREATE {unique}INDEX IF NOT EXISTS "{index["name"]}" '
            f'ON "{table}" ({column_list})'
        )
    conn.exec_driver_sql(
        f'CREATE INDEX IF NOT EXISTS "ix_{table}_workspace_id" '
        f'ON "{table}" (workspace_id)'
    )
