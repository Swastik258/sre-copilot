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

import logging

from sqlalchemy import Engine

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
            for row in conn.exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        if "users" not in tables:
            return applied

        columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)")}
        if _AUTH_COLUMN not in columns:
            conn.exec_driver_sql(
                f"ALTER TABLE users ADD COLUMN {_AUTH_COLUMN} VARCHAR(255)"
            )
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
            existing = {
                row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")
            }
            if column not in existing:
                conn.exec_driver_sql(
                    f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"
                )
                applied.append(f"{table}.{column}")

    # Index creation gets its own transaction: legacy rows may contain duplicate
    # non-null emails, and a failed statement must not poison the earlier work.
    with engine.begin() as conn:
        indexes = {row[1] for row in conn.exec_driver_sql("PRAGMA index_list(users)")}
        if _EMAIL_INDEX not in indexes:
            try:
                conn.exec_driver_sql(
                    f"CREATE UNIQUE INDEX {_EMAIL_INDEX} ON users (email)"
                )
                applied.append(_EMAIL_INDEX)
            except Exception:
                log.warning(
                    "Could not create a unique index on users.email: the local "
                    "database contains duplicate non-null emails. Remove the "
                    "duplicates, or delete the local SQLite file, then restart."
                )

    return applied
