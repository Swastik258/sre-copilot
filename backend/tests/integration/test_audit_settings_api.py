"""Audit trail and settings API tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import AuditEvent, User


def _signup(client, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "correct-horse", "display_name": "Ada"},
    )
    assert response.status_code == 201, response.text
    return response.json()["user"]


def _promote(db_session, email: str) -> None:
    user = db_session.scalar(select(User).where(User.email == email))
    assert user is not None
    user.role = "admin"
    db_session.add(user)
    db_session.commit()


def test_audit_events_are_listed_and_exported(client) -> None:
    _signup(client, "audit-reader@example.com")
    created = client.post(
        "/api/v1/investigations",
        json={"title": "Audit me", "kind": "logs"},
    )
    assert created.status_code == 201, created.text

    listing = client.get("/api/v1/audit-events")
    assert listing.status_code == 200, listing.text
    body = listing.json()
    assert body["total"] >= 1
    assert any(event["action"] == "investigation.create" for event in body["events"])
    assert all("token" not in event for event in body["events"])

    exported = client.get("/api/v1/audit-events/export.csv")
    assert exported.status_code == 200
    assert exported.headers["content-type"].startswith("text/csv")
    assert "investigation.create" in exported.text
    assert "created_at,action,actor,decision" in exported.text


def test_audit_retention_deletes_only_old_events(client, db_session) -> None:
    user = _signup(client, "audit-retention@example.com")
    _promote(db_session, "audit-retention@example.com")
    old = AuditEvent(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
        action="test.old",
        actor="test",
        decision="allow",
        created_at=datetime.now(UTC) - timedelta(days=10),
    )
    db_session.add(old)
    db_session.commit()

    response = client.delete("/api/v1/audit-events?older_than_days=5")
    assert response.status_code == 200, response.text
    assert response.json()["deleted"] >= 1

    remaining = client.get("/api/v1/audit-events?action=test.old")
    assert remaining.status_code == 200
    assert remaining.json()["total"] == 0


def test_audit_read_export_and_retention_are_workspace_scoped(client, db_session) -> None:
    settings = get_settings()
    previous_tenant = settings.default_tenant_id
    settings.default_tenant_id = "default"
    try:
        user = _signup(client, "audit-scope-owner@example.com")
        other_tenant = "audit-scope-other-workspace"
        old = datetime.now(UTC) - timedelta(days=10)
        own_event = AuditEvent(
            user_id=None,
            tenant_id=user["tenant_id"],
            action="test.workspace",
            actor="system",
            decision="allow",
            created_at=old,
        )
        other_event = AuditEvent(
            user_id=None,
            tenant_id=other_tenant,
            action="test.other-workspace",
            actor="system",
            decision="allow",
            created_at=old,
        )
        db_session.add_all([own_event, other_event])
        db_session.commit()
        own_event_id = own_event.id
        other_event_id = other_event.id

        listing = client.get("/api/v1/audit-events?action=test.")
        assert listing.status_code == 200, listing.text
        actions = {event["action"] for event in listing.json()["events"]}
        assert "test.workspace" in actions
        assert "test.other-workspace" not in actions

        exported = client.get("/api/v1/audit-events/export.csv")
        assert exported.status_code == 200
        assert "test.workspace" in exported.text
        assert "test.other-workspace" not in exported.text

        response = client.delete("/api/v1/audit-events?older_than_days=5")
        assert response.status_code == 200, response.text
        assert response.json()["deleted"] >= 1
        db_session.expire_all()
        assert db_session.get(AuditEvent, own_event_id) is None
        assert db_session.get(AuditEvent, other_event_id) is not None
    finally:
        settings.default_tenant_id = previous_tenant


def test_settings_are_readable_and_editable(client, db_session) -> None:
    _signup(client, "settings@example.com")
    _promote(db_session, "settings@example.com")

    initial = client.get("/api/v1/settings")
    assert initial.status_code == 200, initial.text
    assert initial.json()["audit_retention_days"] >= 1
    assert initial.json()["ai_privacy_source"] in {"environment", "override"}

    updated = client.patch(
        "/api/v1/settings",
        json={
            "audit_retention_days": 7,
            "ai_privacy_mode": True,
            "default_environment": "staging",
        },
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["audit_retention_days"] == 7
    assert body["ai_privacy_mode"] is True
    assert body["ai_privacy_source"] == "override"
    assert body["default_environment"] == "staging"

    reread = client.get("/api/v1/settings")
    assert reread.json()["audit_retention_days"] == 7
    assert reread.json()["ai_privacy_mode"] is True

    cleared = client.patch(
        "/api/v1/settings",
        json={"default_environment": None},
    )
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["default_environment"] is None


def test_audit_and_settings_require_authentication(client) -> None:
    client.cookies.clear()
    assert client.get("/api/v1/audit-events").status_code == 401
    assert client.get("/api/v1/settings").status_code == 401
