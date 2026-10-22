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
}


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
            row[0]
            for row in con.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        user_columns = {
            row[1] for row in con.execute("PRAGMA table_info(users)")
        }
        investigation_columns = {
            row[1] for row in con.execute("PRAGMA table_info(investigations)")
        }
        audit_columns = {
            row[1] for row in con.execute("PRAGMA table_info(audit_events)")
        }
    finally:
        con.close()

    assert EXPECTED_TABLES <= tables
    assert {"role", "tenant_id"} <= user_columns
    assert "tenant_id" in investigation_columns
    assert "tenant_id" in audit_columns


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
            for row in con.execute(
                "SELECT organization_id, role FROM organization_memberships"
            )
        }
        verified = dict(
            con.execute("SELECT id, email_verified_at FROM users ORDER BY created_at")
        )
    finally:
        con.close()

    assert roles == {"first-user": "member", "second-user": "member"}
    assert tenants == {"first-user": "default", "second-user": "default"}
    assert memberships == {("default", "member")}
    assert verified["first-user"] is not None
    assert verified["second-user"] is not None
