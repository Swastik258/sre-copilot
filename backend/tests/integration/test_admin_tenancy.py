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


def test_non_admin_cannot_manage_users(client, db_session) -> None:
    _signup(client, "plain-member@example.com")
    user = db_session.scalar(
        select(User).where(User.email == "plain-member@example.com")
    )
    assert user is not None
    user.role = "member"
    db_session.add(user)
    db_session.commit()

    response = client.get("/api/v1/admin/users")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_admin_can_list_users_and_move_a_member_tenant(client) -> None:
    settings = get_settings()
    previous_bootstrap = settings.bootstrap_admin_email
    previous_tenant = settings.default_tenant_id
    settings.bootstrap_admin_email = "tenant-admin@example.com"
    settings.default_tenant_id = "tenant-alpha"
    try:
        admin = _signup(client, "tenant-admin@example.com")
        assert admin["role"] == "admin"
        assert admin["tenant_id"] == "tenant-alpha"

        member = _signup(
            client, "tenant-member@example.com", password="correct-horse"
        )
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
            json={"tenant_id": "tenant-beta"},
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["tenant_id"] == "tenant-beta"

        tenants = client.get("/api/v1/admin/tenants")
        assert tenants.status_code == 200
        assert any(item["tenant_id"] == "tenant-beta" for item in tenants.json()["tenants"])
    finally:
        settings.bootstrap_admin_email = previous_bootstrap
        settings.default_tenant_id = previous_tenant


def test_settings_are_scoped_per_tenant(client) -> None:
    settings = get_settings()
    previous_bootstrap = settings.bootstrap_admin_email
    previous_tenant = settings.default_tenant_id
    settings.bootstrap_admin_email = "tenant-settings-admin@example.com"
    settings.default_tenant_id = "settings-tenant-alpha"
    try:
        _signup(client, "tenant-settings-admin@example.com")
        updated = client.patch(
            "/api/v1/settings",
            json={"audit_retention_days": 14},
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["audit_retention_days"] == 14

        member = _signup(client, "tenant-settings-member@example.com")
        login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "tenant-settings-admin@example.com",
                "password": "correct-horse",
            },
        )
        assert login.status_code == 200
        moved = client.patch(
            f"/api/v1/admin/users/{member['id']}",
            json={"tenant_id": "settings-tenant-beta"},
        )
        assert moved.status_code == 200, moved.text

        member_login = client.post(
            "/api/v1/auth/login",
            json={
                "email": "tenant-settings-member@example.com",
                "password": "correct-horse",
            },
        )
        assert member_login.status_code == 200
        member_settings = client.get("/api/v1/settings")
        assert member_settings.status_code == 200
        assert member_settings.json()["audit_retention_days"] == 30
    finally:
        settings.bootstrap_admin_email = previous_bootstrap
        settings.default_tenant_id = previous_tenant


def test_deactivating_a_member_revokes_their_session(client) -> None:
    settings = get_settings()
    previous_bootstrap = settings.bootstrap_admin_email
    settings.bootstrap_admin_email = "deactivate-admin@example.com"
    try:
        _signup(client, "deactivate-admin@example.com")
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
        settings.bootstrap_admin_email = previous_bootstrap


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
