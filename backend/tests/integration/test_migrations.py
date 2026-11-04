"""Verify that the Alembic migrations actually create the schema.

This runs ``alembic upgrade head`` in a subprocess against a temporary SQLite
database, so it exercises the real migration path (not ``Base.metadata``).
"""

import os
import sqlite3
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]

EXPECTED_TABLES = {
    "users",
    "conversations",
    "messages",
    "integrations",
    "investigations",
    "audit_events",
    "evidence",
    "sessions",
    "app_settings",
    "account_settings",
    "user_api_keys",
    "organizations",
    "organization_memberships",
    "email_tokens",
    "subscriptions",
    "usage_events",
    "billing_webhook_events",
    "background_jobs",
    "idempotency_records",
    "workspaces",
    "workspace_members",
    "workspace_invites",
}

_SCOPED_TABLES = (
    "conversations",
    "messages",
    "integrations",
    "investigations",
    "evidence",
    "audit_events",
)


def test_alembic_upgrade_creates_all_tables(tmp_path):
    db_path = tmp_path / "migration_test.db"
    env = {
        **os.environ,
        "DATABASE_URL": f"sqlite:///{db_path}",
        "ENVIRONMENT": "test",
    }

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"alembic failed:\n{result.stdout}\n{result.stderr}"

    con = sqlite3.connect(db_path)
    try:
        tables = {
            row[0] for row in con.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        user_columns = {row[1] for row in con.execute("PRAGMA table_info(users)")}
        investigation_columns = {row[1] for row in con.execute("PRAGMA table_info(investigations)")}
        audit_columns = {row[1] for row in con.execute("PRAGMA table_info(audit_events)")}
        session_columns = {row[1]: row for row in con.execute("PRAGMA table_info(sessions)")}
        job_columns = {row[1] for row in con.execute("PRAGMA table_info(background_jobs)")}
        idempotency_columns = {
            row[1] for row in con.execute("PRAGMA table_info(idempotency_records)")
        }
        scoped_columns = {
            table: {row[1]: row for row in con.execute(f"PRAGMA table_info({table})")}
            for table in _SCOPED_TABLES
        }
    finally:
        con.close()

    assert EXPECTED_TABLES <= tables
    assert {"role", "tenant_id"} <= user_columns
    assert "tenant_id" in investigation_columns
    assert "tenant_id" in audit_columns
    assert session_columns["last_used_at"][3] == 1
    assert {"encrypted_payload", "status", "available_at"} <= job_columns
    assert {"scope_hash", "idempotency_key", "response_body"} <= idempotency_columns
    for table in _SCOPED_TABLES:
        columns = scoped_columns[table]
        assert "workspace_id" in columns, table
        assert columns["workspace_id"][3] == 1, f"{table}.workspace_id must be NOT NULL"


def _alembic(env, *args):
    return subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )


def test_workspace_backfill_assigns_every_row(tmp_path):
    db_path = tmp_path / "workspace_backfill_test.db"
    env = {
        **os.environ,
        "DATABASE_URL": f"sqlite:///{db_path}",
        "ENVIRONMENT": "test",
    }

    before = _alembic(env, "upgrade", "0010_session_last_used_not_null")
    assert before.returncode == 0, f"alembic failed:\n{before.stdout}\n{before.stderr}"

    con = sqlite3.connect(db_path)
    try:
        con.execute(
            "INSERT INTO users (id, email, is_active, created_at, updated_at) "
            "VALUES ('u1', 'a@example.com', 1, "
            "'2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00')"
        )
        con.execute(
            "INSERT INTO conversations (id, user_id, title, created_at, updated_at) "
            "VALUES ('c1', 'u1', 'Incident', "
            "'2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00')"
        )
        con.execute(
            "INSERT INTO messages (id, conversation_id, role, content, created_at) "
            "VALUES ('m1', 'c1', 'user', 'pod crashed', "
            "'2026-01-01T00:00:00+00:00')"
        )
        con.execute(
            "INSERT INTO integrations (id, kind, name, enabled, created_at, "
            "updated_at) VALUES ('i1', 'kubernetes', 'prod', 0, "
            "'2026-01-01T00:00:00+00:00', '2026-01-01T00:00:00+00:00')"
        )
        con.execute(
            "INSERT INTO audit_events (id, user_id, action, actor, decision, "
            "created_at) VALUES ('a1', 'u1', 'auth.login', 'user', 'allow', "
            "'2026-01-01T00:00:00+00:00')"
        )
        con.execute(
            "INSERT INTO audit_events (id, user_id, action, actor, decision, "
            "created_at) VALUES ('a2', NULL, 'system.tick', 'system', 'allow', "
            "'2026-01-01T00:00:00+00:00')"
        )
        con.commit()
    finally:
        con.close()

    after = _alembic(env, "upgrade", "head")
    assert after.returncode == 0, f"alembic failed:\n{after.stdout}\n{after.stderr}"

    con = sqlite3.connect(db_path)
    try:
        user_workspace = con.execute(
            "SELECT w.id, w.slug FROM workspaces w "
            "JOIN workspace_members m ON m.workspace_id = w.id "
            "WHERE m.user_id = 'u1'"
        ).fetchone()
        conversation_workspace = con.execute(
            "SELECT workspace_id FROM conversations WHERE id = 'c1'"
        ).fetchone()[0]
        message_workspace = con.execute(
            "SELECT workspace_id FROM messages WHERE id = 'm1'"
        ).fetchone()[0]
        owned_audit = con.execute(
            "SELECT workspace_id FROM audit_events WHERE id = 'a1'"
        ).fetchone()[0]
        orphan_audit = con.execute(
            "SELECT workspace_id FROM audit_events WHERE id = 'a2'"
        ).fetchone()[0]
        integration_workspace = con.execute(
            "SELECT workspace_id FROM integrations WHERE id = 'i1'"
        ).fetchone()[0]
        quarantine = con.execute(
            "SELECT id FROM workspaces WHERE slug = 'quarantine'"
        ).fetchone()[0]
        quarantine_members = con.execute(
            "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = ?",
            (quarantine,),
        ).fetchone()[0]
    finally:
        con.close()

    assert user_workspace is not None
    user_workspace_id, user_slug = user_workspace
    assert user_slug == "a"
    assert conversation_workspace == user_workspace_id
    assert message_workspace == conversation_workspace
    assert owned_audit == user_workspace_id
    assert integration_workspace == quarantine
    assert orphan_audit == quarantine
    assert quarantine_members == 0  # quarantine is memberless

    # Idempotent: re-running the backfill range must not raise.
    again = _alembic(env, "upgrade", "head")
    assert again.returncode == 0


def test_upgrade_keeps_existing_accounts_as_members(tmp_path):
    db_path = tmp_path / "migration_roles_test.db"
    env = {
        **os.environ,
        "DATABASE_URL": f"sqlite:///{db_path}",
        "ENVIRONMENT": "test",
    }

    before = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "0004_app_settings"],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert before.returncode == 0, f"alembic failed:\n{before.stdout}\n{before.stderr}"

    con = sqlite3.connect(db_path)
    try:
        con.execute(
            "INSERT INTO users "
            "(id, email, is_active, created_at, updated_at) "
            "VALUES (?, ?, 1, ?, ?)",
            (
                "first-user",
                "first@example.com",
                "2026-01-01T00:00:00+00:00",
                "2026-01-01T00:00:00+00:00",
            ),
        )
        con.execute(
            "INSERT INTO users "
            "(id, email, is_active, created_at, updated_at) "
            "VALUES (?, ?, 1, ?, ?)",
            (
                "second-user",
                "second@example.com",
                "2026-01-02T00:00:00+00:00",
                "2026-01-02T00:00:00+00:00",
            ),
        )
        con.commit()
    finally:
        con.close()

    after = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )
    assert after.returncode == 0, f"alembic failed:\n{after.stdout}\n{after.stderr}"

    con = sqlite3.connect(db_path)
    try:
        roles = dict(con.execute("SELECT id, role FROM users ORDER BY created_at"))
        tenants = dict(con.execute("SELECT id, tenant_id FROM users ORDER BY created_at"))
        memberships = {
            (row[0], row[1])
            for row in con.execute("SELECT organization_id, role FROM organization_memberships")
        }
        verified = dict(con.execute("SELECT id, email_verified_at FROM users ORDER BY created_at"))
    finally:
        con.close()

    assert roles == {"first-user": "member", "second-user": "member"}
    assert tenants == {"first-user": "default", "second-user": "default"}
    assert memberships == {("default", "member")}
    assert verified["first-user"] is not None
    assert verified["second-user"] is not None
