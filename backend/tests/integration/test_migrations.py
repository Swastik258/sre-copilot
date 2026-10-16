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
    finally:
        con.close()

    assert EXPECTED_TABLES <= tables
