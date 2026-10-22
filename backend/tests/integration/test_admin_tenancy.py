"""Role, tenant, admin, and production security tests."""

from __future__ import annotations

from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import User


def _signup(client, email: str, password: str = "correct-horse") -> dict:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password, "display_name": "Ada"},
    )
    assert response.status_code == 201, response.text
    return response.json()["user"]


def _grant_admin(db_session, user_id: str) -> None:
    user = db_session.get(User, user_id)
    assert user is not None
    user.role = "admin"
    db_session.commit()


def test_non_admin_cannot_manage_users(client, db_session) -> None:
    _signup(client, "plain-member@example.com")
    user = db_session.scalar(select(User).where(User.email == "plain-member@example.com"))
    assert user is not None
    user.role = "member"
    db_session.add(user)
    db_session.commit()

    response = client.get("/api/v1/admin/users")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_admin_can_list_users_but_cannot_move_members_between_workspaces(
    client, db_session
) -> None:
    settings = get_settings()
    previous_tenant = settings.default_tenant_id
    settings.default_tenant_id = "tenant-alpha"
    try:
        admin = _signup(client, "tenant-admin@example.com")
        _grant_admin(db_session, admin["id"])
        assert admin["tenant_id"] == "tenant-alpha"

        member = _signup(client, "tenant-member@example.com", password="correct-horse")
        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "tenant-admin@example.com",
                "password": "correct-horse",
            },
        )
        assert login.status_code == 200

        listing = client.get("/api/v1/admin/users")
        assert listing.status_code == 200
        assert listing.json()["total"] >= 2

        updated = client.patch(
            f"/api/v1/admin/users/{member['id']}",
            json={"role": "viewer"},
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["role"] == "viewer"

        moved = client.patch(
            f"/api/v1/admin/users/{member['id']}",
            json={"tenant_id": "tenant-beta"},
        )
        assert moved.status_code == 403, moved.text
        assert moved.json()["error"]["code"] == "forbidden"

        tenants = client.get("/api/v1/admin/tenants")
        assert tenants.status_code == 200
        assert [item["tenant_id"] for item in tenants.json()["tenants"]] == ["tenant-alpha"]
    finally:
        settings.default_tenant_id = previous_tenant


def test_settings_are_scoped_per_tenant(client, db_session) -> None:
    settings = get_settings()
    previous_tenant = settings.default_tenant_id
    settings.default_tenant_id = "settings-tenant-alpha"
    try:
        admin = _signup(client, "tenant-settings-admin@example.com")
        _grant_admin(db_session, admin["id"])
        updated = client.patch(
            "/api/v1/settings",
            json={"audit_retention_days": 14},
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["audit_retention_days"] == 14

        # A second workspace has its own settings row and cannot be seen by the
        # first workspace's administrator.
        settings.default_tenant_id = "settings-tenant-beta"
        _signup(client, "tenant-settings-member@example.com")
        member_settings = client.get("/api/v1/settings")
        assert member_settings.status_code == 200
        assert member_settings.json()["audit_retention_days"] == 30

        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "tenant-settings-admin@example.com",
                "password": "correct-horse",
            },
        )
        assert login.status_code == 200
        admin_listing = client.get("/api/v1/admin/users")
        assert admin_listing.status_code == 200
        assert all(
            user["tenant_id"] == "settings-tenant-alpha" for user in admin_listing.json()["users"]
        )
    finally:
        settings.default_tenant_id = previous_tenant


def test_deactivating_a_member_revokes_their_session(client, db_session) -> None:
    settings = get_settings()
    previous_tenant = settings.default_tenant_id
    settings.default_tenant_id = "deactivate-tenant"
    try:
        admin = _signup(client, "deactivate-admin@example.com")
        _grant_admin(db_session, admin["id"])
        member = _signup(client, "deactivate-member@example.com")
        member_token = client.cookies.get("sre_session")
        assert member_token

        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "deactivate-admin@example.com",
                "password": "correct-horse",
            },
        )
        assert login.status_code == 200
        assert client.get("/api/v1/auth/me").json()["role"] == "admin"

        response = client.patch(
            f"/api/v1/admin/users/{member['id']}",
            json={"is_active": False},
        )
        assert response.status_code == 200, response.text
        assert response.json()["is_active"] is False

        client.cookies.set("sre_session", member_token)
        assert client.get("/api/v1/auth/me").status_code == 401
    finally:
        settings.default_tenant_id = previous_tenant


def test_security_headers_are_present(client) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert "content-security-policy" in response.headers


def test_production_requires_authentication_even_when_flag_is_off(client) -> None:
    settings = get_settings()
    previous_environment = settings.environment
    settings.environment = "production"
    client.cookies.clear()
    try:
        response = client.get("/api/v1/integrations")
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "unauthorized"
        assert client.get("/api/v1/health").status_code == 200
    finally:
        settings.environment = previous_environment
