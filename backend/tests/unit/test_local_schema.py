"""Tests for the additive local SQLite upgrade path."""

from __future__ import annotations

from sqlalchemy import create_engine, text

from app.db.local_schema import upgrade_local_sqlite_schema


def _legacy_engine(tmp_path, users: list[tuple[str, str]]):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with engine.begin() as conn:
        conn.exec_driver_sql("CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(320))")
        for user_id, email in users:
            conn.execute(
                text("INSERT INTO users (id, email) VALUES (:id, :email)"),
                {"id": user_id, "email": email},
            )
    return engine


def _columns(engine) -> set[str]:
    with engine.connect() as conn:
        return {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)")}


def _indexes(engine) -> set[str]:
    with engine.connect() as conn:
        return {row[1] for row in conn.exec_driver_sql("PRAGMA index_list(users)")}


def test_upgrades_a_pre_auth_database(tmp_path):
    engine = _legacy_engine(tmp_path, [("u1", "a@example.com"), ("u2", "b@example.com")])

    applied = upgrade_local_sqlite_schema(engine)

    assert applied == [
        "users.password_hash",
        "users.role",
        "users.tenant_id",
        "users.email_verified_at",
        "users.failed_login_count",
        "users.locked_until",
        "users.password_changed_at",
        "workspaces",
        "workspace_members",
        "workspace_invites",
        "workspace:a",
        "workspace:b",
        "ix_users_email",
    ]
    assert "password_hash" in _columns(engine)
    assert "role" in _columns(engine)
    assert "tenant_id" in _columns(engine)
    assert "email_verified_at" in _columns(engine)
    assert "failed_login_count" in _columns(engine)
    assert "ix_users_email" in _indexes(engine)
    with engine.connect() as conn:
        roles = dict(conn.exec_driver_sql("SELECT id, role FROM users ORDER BY rowid").all())
    assert roles == {"u1": "member", "u2": "member"}


def test_is_idempotent(tmp_path):
    engine = _legacy_engine(tmp_path, [("u1", "a@example.com")])

    upgrade_local_sqlite_schema(engine)

    assert upgrade_local_sqlite_schema(engine) == []


def test_duplicate_emails_do_not_break_the_upgrade(tmp_path):
    engine = _legacy_engine(tmp_path, [("u1", "dup@example.com"), ("u2", "dup@example.com")])

    applied = upgrade_local_sqlite_schema(engine)

    assert applied == [
        "users.password_hash",
        "users.role",
        "users.tenant_id",
        "users.email_verified_at",
        "users.failed_login_count",
        "users.locked_until",
        "users.password_changed_at",
        "workspaces",
        "workspace_members",
        "workspace_invites",
        "workspace:dup",
        "workspace:dup-2",
    ]
    assert "password_hash" in _columns(engine)
    assert "ix_users_email" not in _indexes(engine)


def test_workspace_backfill_on_populated_legacy_database(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with engine.begin() as conn:
        conn.exec_driver_sql(
            "CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(320), "
            "created_at DATETIME)"
        )
        conn.exec_driver_sql(
            "CREATE TABLE conversations (id VARCHAR(36) PRIMARY KEY, "
            "user_id VARCHAR(36) NOT NULL, title VARCHAR(200) NOT NULL, "
            "created_at DATETIME, updated_at DATETIME)"
        )
        conn.exec_driver_sql(
            "CREATE TABLE messages (id VARCHAR(36) PRIMARY KEY, "
            "conversation_id VARCHAR(36) NOT NULL, role VARCHAR(16) NOT NULL, "
            "content TEXT NOT NULL, created_at DATETIME)"
        )
        conn.exec_driver_sql(
            "CREATE TABLE integrations (id VARCHAR(36) PRIMARY KEY, "
            "kind VARCHAR(32) NOT NULL, name VARCHAR(120) NOT NULL, "
            "enabled INTEGER NOT NULL, created_at DATETIME, updated_at DATETIME)"
        )
        conn.exec_driver_sql(
            "INSERT INTO users (id, email, created_at) VALUES "
            "('u1', 'a@example.com', '2026-01-01T00:00:00')"
        )
        conn.exec_driver_sql(
            "INSERT INTO conversations (id, user_id, title, created_at, updated_at) "
            "VALUES ('c1', 'u1', 'Incident', '2026-01-01T00:00:00', '2026-01-01T00:00:00')"
        )
        conn.exec_driver_sql(
            "INSERT INTO messages (id, conversation_id, role, content, created_at) "
            "VALUES ('m1', 'c1', 'user', 'pod crashed', '2026-01-01T00:00:00')"
        )
        conn.exec_driver_sql(
            "INSERT INTO integrations (id, kind, name, enabled, created_at, updated_at) "
            "VALUES ('i1', 'kubernetes', 'prod', 0, '2026-01-01T00:00:00', '2026-01-01T00:00:00')"
        )

    upgrade_local_sqlite_schema(engine)

    with engine.connect() as conn:
        user_workspace = conn.exec_driver_sql(
            "SELECT w.id FROM workspaces w JOIN workspace_members m "
            "ON m.workspace_id = w.id WHERE m.user_id = 'u1'"
        ).scalar()
        user_slug = conn.exec_driver_sql(
            "SELECT w.slug FROM workspaces w JOIN workspace_members m "
            "ON m.workspace_id = w.id WHERE m.user_id = 'u1'"
        ).scalar()
        conversation_workspace = conn.exec_driver_sql(
            "SELECT workspace_id FROM conversations WHERE id = 'c1'"
        ).scalar()
        message_workspace = conn.exec_driver_sql(
            "SELECT workspace_id FROM messages WHERE id = 'm1'"
        ).scalar()
        integration_workspace = conn.exec_driver_sql(
            "SELECT workspace_id FROM integrations WHERE id = 'i1'"
        ).scalar()
        quarantine = conn.exec_driver_sql(
            "SELECT id FROM workspaces WHERE slug = 'quarantine'"
        ).scalar()
        columns = {
            row[1]: row[3]
            for row in conn.exec_driver_sql("PRAGMA table_info(conversations)")
        }

    assert user_slug == "a"
    assert conversation_workspace == user_workspace
    assert message_workspace == conversation_workspace
    assert quarantine is not None
    assert integration_workspace == quarantine
    assert columns["workspace_id"] == 1  # NOT NULL enforced on the recreated table


def test_workspace_mirror_is_idempotent_on_populated_database(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with engine.begin() as conn:
        conn.exec_driver_sql(
            "CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(320))"
        )
        conn.exec_driver_sql(
            "INSERT INTO users (id, email) VALUES ('u1', 'a@example.com')"
        )

    upgrade_local_sqlite_schema(engine)

    assert upgrade_local_sqlite_schema(engine) == []
