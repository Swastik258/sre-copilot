"""Tests for the additive local SQLite upgrade path."""

from __future__ import annotations

from sqlalchemy import create_engine, text

from app.db.local_schema import upgrade_local_sqlite_schema


def _legacy_engine(tmp_path, users: list[tuple[str, str]]):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with engine.begin() as conn:
        conn.exec_driver_sql(
            "CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(320))"
        )
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
        "users.role(admin)",
        "ix_users_email",
    ]
    assert "password_hash" in _columns(engine)
    assert "role" in _columns(engine)
    assert "tenant_id" in _columns(engine)
    assert "ix_users_email" in _indexes(engine)
    with engine.connect() as conn:
        roles = dict(conn.exec_driver_sql("SELECT id, role FROM users ORDER BY rowid").all())
    assert roles == {"u1": "admin", "u2": "member"}


def test_is_idempotent(tmp_path):
    engine = _legacy_engine(tmp_path, [("u1", "a@example.com")])

    upgrade_local_sqlite_schema(engine)

    assert upgrade_local_sqlite_schema(engine) == []


def test_duplicate_emails_do_not_break_the_upgrade(tmp_path):
    engine = _legacy_engine(
        tmp_path, [("u1", "dup@example.com"), ("u2", "dup@example.com")]
    )

    applied = upgrade_local_sqlite_schema(engine)

    assert applied == [
        "users.password_hash",
        "users.role",
        "users.tenant_id",
        "users.role(admin)",
    ]
    assert "password_hash" in _columns(engine)
    assert "ix_users_email" not in _indexes(engine)
