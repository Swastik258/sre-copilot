"""Customer account settings and API-key isolation tests."""

from __future__ import annotations

from sqlalchemy import select

from app.db.models import User, UserApiKey


def _signup(client, email: str) -> str:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "correct-horse", "display_name": "SRE User"},
    )
    assert response.status_code == 201, response.text
    return response.json()["user"]["id"]


def test_preferences_profile_and_integrations_persist_per_user(client):
    user_id = _signup(client, "account-settings@example.com")
    update = client.patch("/api/v1/account/preferences", json={"theme": "system"})
    assert update.status_code == 200
    assert update.json()["theme"] == "system"
    integration = client.put(
        "/api/v1/account/integrations/github", json={"connected": True}
    )
    assert integration.status_code == 200
    profile = client.patch(
        "/api/v1/account/profile",
        json={"display_name": "Updated Name", "email": "updated@example.com",
              "current_password": "correct-horse"},
    )
    assert profile.status_code == 200
    assert profile.json() == {"display_name": "Updated Name", "email": "updated@example.com"}

    saved = client.get("/api/v1/account")
    assert saved.status_code == 200
    assert saved.json()["profile"]["email"] == "updated@example.com"
    assert saved.json()["preferences"]["theme"] == "system"
    assert saved.json()["integrations"]["github"] is True
    assert saved.json()["plan"] == "free"

    other = _signup(client, "different-account@example.com")
    assert other != user_id
    empty = client.get("/api/v1/account")
    assert empty.status_code == 200
    assert empty.json()["preferences"]["theme"] == "dark"
    assert empty.json()["integrations"]["github"] is False


def test_api_key_is_shown_once_hashed_and_revocable(client, db_session):
    user_id = _signup(client, "api-key-owner@example.com")
    created = client.post("/api/v1/account/api-keys", json={"name": "automation"})
    assert created.status_code == 201, created.text
    body = created.json()
    raw_key = body["key"]
    assert raw_key.startswith("sre_")

    record = db_session.scalar(select(UserApiKey).where(UserApiKey.id == body["id"]))
    assert record is not None
    assert record.user_id == user_id
    assert raw_key not in record.key_hash
    assert "key" not in client.get("/api/v1/account").json()["api_keys"][0]

    client.cookies.clear()
    authenticated = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {raw_key}"}
    )
    assert authenticated.status_code == 200
    assert authenticated.json()["id"] == user_id
    client.cookies.set("sre_session", "")
    revoked = client.delete(
        f"/api/v1/account/api-keys/{body['id']}",
        headers={"Authorization": f"Bearer {raw_key}"},
    )
    assert revoked.status_code == 204
    invalid = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {raw_key}"}
    )
    assert invalid.status_code == 401


def test_account_api_requires_auth_and_keys_are_owner_scoped(client):
    client.cookies.clear()
    assert client.get("/api/v1/account").status_code == 401

    _signup(client, "first-key-owner@example.com")
    key = client.post("/api/v1/account/api-keys", json={"name": "private"})
    assert key.status_code == 201
    key_id = key.json()["id"]

    _signup(client, "second-key-owner@example.com")
    not_owner = client.delete(f"/api/v1/account/api-keys/{key_id}")
    assert not_owner.status_code == 404
    own_account = client.get("/api/v1/account")
    assert own_account.status_code == 200
    assert own_account.json()["api_keys"] == []


def test_password_change_and_account_deletion_require_password(client, db_session):
    user_id = _signup(client, "account-delete@example.com")
    rejected = client.post(
        "/api/v1/account/password",
        json={"current_password": "incorrect", "new_password": "new-secure-password"},
    )
    assert rejected.status_code == 401
    changed = client.post(
        "/api/v1/account/password",
        json={"current_password": "correct-horse", "new_password": "new-secure-password"},
    )
    assert changed.status_code == 204
    deleted_wrong = client.request(
        "DELETE", "/api/v1/account", json={"password": "incorrect"}
    )
    assert deleted_wrong.status_code == 401
    deleted = client.request(
        "DELETE", "/api/v1/account", json={"password": "new-secure-password"}
    )
    assert deleted.status_code == 204
    assert db_session.get(User, user_id) is None
