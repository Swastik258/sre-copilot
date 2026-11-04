"""Workspace CRUD, membership, and invite endpoints — with negative tests."""

from __future__ import annotations

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

PASSWORD = "correct-horse"


def _signup(client: TestClient, email: str, display_name: str | None = None) -> dict:
    payload: dict = {"email": email, "password": PASSWORD}
    if display_name:
        payload["display_name"] = display_name
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == status.HTTP_201_CREATED, response.text
    return response.json()


def _new_client() -> TestClient:
    return TestClient(app)


def _slug(client: TestClient) -> str:
    workspaces = client.get("/api/v1/workspaces").json()["workspaces"]
    assert workspaces
    return workspaces[0]["slug"]


def test_signup_creates_personal_workspace(client):
    body = _signup(client, "ws-owner@example.com", display_name="Ada Lovelace")

    assert body["workspace_slug"]
    listing = client.get("/api/v1/workspaces")
    assert listing.status_code == 200
    workspaces = listing.json()["workspaces"]
    assert len(workspaces) == 1
    assert workspaces[0]["slug"] == body["workspace_slug"]
    assert workspaces[0]["role"] == "owner"


def test_create_get_and_patch_workspace(client):
    _signup(client, "creator@example.com")

    created = client.post("/api/v1/workspaces", json={"name": "Acme Reliability"})
    assert created.status_code == status.HTTP_201_CREATED, created.text
    body = created.json()
    assert body["role"] == "owner"
    assert body["slug"]

    got = client.get(f"/api/v1/workspaces/{body['slug']}")
    assert got.status_code == 200
    assert got.json()["name"] == "Acme Reliability"

    patched = client.patch(
        f"/api/v1/workspaces/{body['slug']}", json={"name": "Acme SRE"}
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Acme SRE"

    assert (
        client.get("/api/v1/workspaces/nope-does-not-exist").status_code == 404
    )


def test_workspace_id_in_body_is_rejected(client):
    _signup(client, "strict-schema@example.com")
    response = client.post(
        "/api/v1/workspaces",
        json={"name": "Injected", "workspace_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert response.status_code == 422


def test_non_member_and_missing_workspace_return_identical_404s():
    with _new_client() as owner_client:
        _signup(owner_client, "secret-owner@example.com")
        slug = _slug(owner_client)

    with _new_client() as outsider:
        _signup(outsider, "outside@example.com")
        member_response = outsider.get(f"/api/v1/workspaces/{slug}")
        missing_response = outsider.get("/api/v1/workspaces/does-not-exist")

    assert member_response.status_code == 404
    assert missing_response.status_code == 404
    # The error envelope carries a per-request correlation id on every error,
    # so byte-identity is asserted on the content fields; both responses must
    # still carry a request_id.
    import json as _json

    member_body = _json.loads(member_response.content)
    missing_body = _json.loads(missing_response.content)
    assert member_body["error"].pop("request_id")
    assert missing_body["error"].pop("request_id")
    assert member_body == missing_body
    assert (
        member_response.headers.get("content-type")
        == missing_response.headers.get("content-type")
    )


def test_invite_flow_accept_and_single_use():
    with _new_client() as owner_client:
        _signup(owner_client, "inviter@example.com")
        slug = _slug(owner_client)
        invite = owner_client.post(
            f"/api/v1/workspaces/{slug}/invites",
            json={"email": "invitee@example.com", "role": "member"},
        )
        assert invite.status_code == 201, invite.text
        token = invite.json()["token"]

    with _new_client() as invitee:
        _signup(invitee, "invitee@example.com")
        accepted = invitee.post(f"/api/v1/invites/{token}/accept")
        assert accepted.status_code == 200, accepted.text
        assert accepted.json()["workspace"]["slug"] == slug

        # Single use: the same token is dead after acceptance.
        assert invitee.post(f"/api/v1/invites/{token}/accept").status_code == 404

        # Membership is now active.
        assert invitee.get(f"/api/v1/workspaces/{slug}").status_code == 200


def test_invite_requires_matching_email_and_known_token():
    with _new_client() as owner_client:
        _signup(owner_client, "inviter2@example.com")
        slug = _slug(owner_client)
        invite = owner_client.post(
            f"/api/v1/workspaces/{slug}/invites",
            json={"email": "right-person@example.com", "role": "member"},
        )
        token = invite.json()["token"]

    with _new_client() as wrong_user:
        _signup(wrong_user, "wrong-person@example.com")
        assert (
            wrong_user.post(f"/api/v1/invites/{token}/accept").status_code == 403
        )

    with _new_client() as anyone:
        _signup(anyone, "anyone@example.com")
        assert anyone.post("/api/v1/invites/not-a-real-token/accept").status_code == 404


def test_member_management_and_last_owner_protection():
    with _new_client() as owner_client, _new_client() as second:
        _signup(owner_client, "ws-last-owner@example.com")
        slug = _slug(owner_client)
        owner_id = owner_client.get("/api/v1/auth/me").json()["id"]

        # The only owner cannot be removed.
        response = owner_client.delete(f"/api/v1/workspaces/{slug}/members/{owner_id}")
        assert response.status_code == 409

        # Add an admin. Even so, the only owner cannot leave: matching the
        # organization service rule, another owner must exist first. The
        # direct add requires the account to exist, so create it first.
        second.post(
            "/api/v1/auth/signup",
            json={"email": "ws-second-admin@example.com", "password": PASSWORD},
        )
        added = owner_client.post(
            f"/api/v1/workspaces/{slug}/members",
            json={"email": "ws-second-admin@example.com", "role": "admin"},
        )
        assert added.status_code == 201, added.text

        still_blocked = owner_client.delete(
            f"/api/v1/workspaces/{slug}/members/{owner_id}"
        )
        assert still_blocked.status_code == 409

        # Promote the admin to owner; then the original owner may leave.
        second_id = second.get("/api/v1/auth/me").json()["id"]
        promoted = owner_client.patch(
            f"/api/v1/workspaces/{slug}/members/{second_id}",
            json={"role": "owner"},
        )
        assert promoted.status_code == 200, promoted.text

        removed = owner_client.delete(
            f"/api/v1/workspaces/{slug}/members/{owner_id}"
        )
        assert removed.status_code == 204

        # The removed owner is now a non-member: the identical 404 any
        # outsider gets. The remaining owner sees the member list.
        assert owner_client.get(f"/api/v1/workspaces/{slug}").status_code == 404
        members = second.get(f"/api/v1/workspaces/{slug}/members")
        assert members.status_code == 200
        assert {m["role"] for m in members.json()["members"]} == {"owner"}

        # Unknown member delete is a negative path.
        missing = second.delete(
            f"/api/v1/workspaces/{slug}/members/00000000-0000-0000-0000-000000000000"
        )
        assert missing.status_code == 404


def test_viewer_role_is_read_only():
    with _new_client() as owner_client:
        _signup(owner_client, "ws-viewer-owner@example.com")
        slug = _slug(owner_client)
        invite = owner_client.post(
            f"/api/v1/workspaces/{slug}/invites",
            json={"email": "ws-viewer@example.com", "role": "viewer"},
        )
        token = invite.json()["token"]

    with _new_client() as viewer:
        _signup(viewer, "ws-viewer@example.com")
        assert viewer.post(f"/api/v1/invites/{token}/accept").status_code == 200

        # Read is allowed for viewers.
        assert viewer.get(f"/api/v1/workspaces/{slug}/members").status_code == 200

        # Management is forbidden (403 for members; never 404).
        assert (
            viewer.post(
                f"/api/v1/workspaces/{slug}/invites",
                json={"email": "x@example.com"},
            ).status_code
            == 403
        )
        assert (
            viewer.patch(
                f"/api/v1/workspaces/{slug}", json={"name": "Hijacked"}
            ).status_code
            == 403
        )


def test_delete_workspace_requires_owner_and_confirmation():
    with _new_client() as owner_client, _new_client() as admin_client:
        _signup(owner_client, "ws-delete-owner@example.com")
        slug = _slug(owner_client)
        invite = owner_client.post(
            f"/api/v1/workspaces/{slug}/invites",
            json={"email": "ws-delete-admin@example.com", "role": "admin"},
        )
        admin_client.post("/api/v1/auth/signup", json={"email": "ws-delete-admin@example.com", "password": PASSWORD})
        admin_client.post(f"/api/v1/invites/{invite.json()['token']}/accept")

        # Admins cannot delete a workspace.
        admin_attempt = admin_client.request(
            "DELETE",
            f"/api/v1/workspaces/{slug}",
            json={"confirm": slug},
        )
        assert admin_attempt.status_code == 403

        # Wrong confirmation is rejected.
        bad_confirm = owner_client.request(
            "DELETE", f"/api/v1/workspaces/{slug}", json={"confirm": "wrong"}
        )
        assert bad_confirm.status_code == 400

        # Correct confirmation deletes; membership disappears for everyone.
        deleted = owner_client.request(
            "DELETE", f"/api/v1/workspaces/{slug}", json={"confirm": slug}
        )
        assert deleted.status_code == 204
        assert owner_client.get(f"/api/v1/workspaces/{slug}").status_code == 404
        assert admin_client.get(f"/api/v1/workspaces/{slug}").status_code == 404
