"""Organization membership, role boundaries, and workspace switching."""

from __future__ import annotations

from app.core.config import get_settings


def _signup(client, email: str, password: str = "correct-horse") -> dict:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": password, "display_name": email.split("@")[0]},
    )
    assert response.status_code == 201, response.text
    return response.json()["user"]


def _login(client, email: str, password: str = "correct-horse") -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["user"]


def test_owner_can_create_workspace_and_add_member(client) -> None:
    owner = _signup(client, "org-owner@example.com")
    assert owner["role"] == "owner"
    owner_org = owner["tenant_id"]

    created = client.post("/api/v1/organizations", json={"name": "Platform Team"})
    assert created.status_code == 201, created.text
    created_org = created.json()
    assert created_org["role"] == "owner"
    assert created_org["id"] != owner_org

    listing = client.get("/api/v1/organizations")
    assert listing.status_code == 200
    assert listing.json()["total"] == 2
    assert listing.json()["active_id"] == owner_org

    member = _signup(client, "org-member@example.com")
    _login(client, "org-owner@example.com")
    added = client.post(
        f"/api/v1/organizations/{owner_org}/members",
        json={"email": "org-member@example.com", "role": "member"},
    )
    assert added.status_code == 201, added.text
    assert added.json()["user_id"] == member["id"]

    members = client.get(f"/api/v1/organizations/{owner_org}/members")
    assert members.status_code == 200
    roles = {item["user_id"]: item["role"] for item in members.json()["members"]}
    assert roles[owner["id"]] == "owner"
    assert roles[member["id"]] == "member"


def test_viewer_cannot_create_investigations(client) -> None:
    owner = _signup(client, "viewer-owner@example.com")
    org_id = owner["tenant_id"]
    _signup(client, "viewer-member@example.com")
    _login(client, "viewer-owner@example.com")
    client.post(
        f"/api/v1/organizations/{org_id}/members",
        json={"email": "viewer-member@example.com", "role": "viewer"},
    )

    _login(client, "viewer-member@example.com")
    switched = client.post(f"/api/v1/organizations/{org_id}/switch")
    assert switched.status_code == 200, switched.text
    assert switched.json()["role"] == "viewer"

    denied = client.post("/api/v1/investigations", json={"title": "Should fail", "kind": "logs"})
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "forbidden"

    # Viewers still have read access inside their workspace.
    assert client.get("/api/v1/investigations").status_code == 200


def test_last_owner_cannot_be_demoted_or_removed(client) -> None:
    owner = _signup(client, "last-owner@example.com")
    org_id = owner["tenant_id"]

    demoted = client.patch(
        f"/api/v1/organizations/{org_id}/members/{owner['id']}",
        json={"role": "member"},
    )
    assert demoted.status_code == 409, demoted.text

    removed = client.delete(f"/api/v1/organizations/{org_id}/members/{owner['id']}")
    assert removed.status_code == 409, removed.text


def test_non_members_cannot_read_a_workspace(client) -> None:
    owner = _signup(client, "private-owner@example.com")
    other = _signup(client, "private-other@example.com")
    assert other["tenant_id"] != owner["tenant_id"]

    response = client.get(f"/api/v1/organizations/{owner['tenant_id']}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_shared_workspace_configuration_keeps_members_as_members(client) -> None:
    settings = get_settings()
    previous = settings.default_tenant_id
    settings.default_tenant_id = "shared-signup-workspace"
    try:
        first = _signup(client, "shared-first@example.com")
        second = _signup(client, "shared-second@example.com")
        assert first["tenant_id"] == second["tenant_id"] == "shared-signup-workspace"
        assert first["role"] == "member"
        assert second["role"] == "member"
        members = client.get("/api/v1/organizations/shared-signup-workspace/members")
        assert members.status_code == 200
        assert members.json()["total"] >= 2
    finally:
        settings.default_tenant_id = previous


def test_workspace_update_and_admin_boundaries(client) -> None:
    owner = _signup(client, "boundary-owner@example.com")
    org_id = owner["tenant_id"]
    _signup(client, "boundary-admin@example.com")
    _signup(client, "boundary-member@example.com")
    _login(client, "boundary-owner@example.com")
    assert (
        client.post(
            f"/api/v1/organizations/{org_id}/members",
            json={"email": "boundary-admin@example.com", "role": "admin"},
        ).status_code
        == 201
    )
    member = client.post(
        f"/api/v1/organizations/{org_id}/members",
        json={"email": "boundary-member@example.com", "role": "member"},
    )
    assert member.status_code == 201, member.text
    member_id = member.json()["user_id"]

    _login(client, "boundary-member@example.com")
    denied = client.patch(f"/api/v1/organizations/{org_id}", json={"name": "Member Rename"})
    assert denied.status_code == 403

    _login(client, "boundary-admin@example.com")
    renamed = client.patch(f"/api/v1/organizations/{org_id}", json={"name": "Admin Rename"})
    assert renamed.status_code == 200, renamed.text
    assert renamed.json()["name"] == "Admin Rename"

    cannot_grant_owner = client.patch(
        f"/api/v1/organizations/{org_id}/members/{member_id}",
        json={"role": "owner"},
    )
    assert cannot_grant_owner.status_code == 403
    cannot_remove_owner = client.delete(f"/api/v1/organizations/{org_id}/members/{owner['id']}")
    assert cannot_remove_owner.status_code == 403

    _login(client, "boundary-owner@example.com")
    promoted = client.patch(
        f"/api/v1/organizations/{org_id}/members/{member_id}",
        json={"role": "viewer"},
    )
    assert promoted.status_code == 200, promoted.text
    assert promoted.json()["role"] == "viewer"

    duplicate = client.post(
        f"/api/v1/organizations/{org_id}/members",
        json={"email": "boundary-member@example.com", "role": "member"},
    )
    assert duplicate.status_code == 409
    missing = client.post(
        f"/api/v1/organizations/{org_id}/members",
        json={"email": "nobody-here@example.com", "role": "member"},
    )
    assert missing.status_code == 404
    assert client.post("/api/v1/organizations/not-a-real-org/switch").status_code == 404


def test_removed_member_falls_back_to_a_personal_workspace(client) -> None:
    owner = _signup(client, "remove-owner@example.com")
    org_id = owner["tenant_id"]
    removed = _signup(client, "remove-target@example.com")
    _login(client, "remove-owner@example.com")
    added = client.post(
        f"/api/v1/organizations/{org_id}/members",
        json={"email": "remove-target@example.com", "role": "member"},
    )
    assert added.status_code == 201, added.text

    _login(client, "remove-target@example.com")
    switched = client.post(f"/api/v1/organizations/{org_id}/switch")
    assert switched.status_code == 200
    assert switched.json()["tenant_id"] == org_id

    _login(client, "remove-owner@example.com")
    response = client.delete(f"/api/v1/organizations/{org_id}/members/{removed['id']}")
    assert response.status_code == 204, response.text

    _login(client, "remove-target@example.com")
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["tenant_id"] != org_id
    assert me.json()["role"] == "owner"
    assert client.get(f"/api/v1/organizations/{org_id}").status_code == 404
