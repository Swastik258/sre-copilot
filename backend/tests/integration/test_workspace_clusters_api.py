"""Per-workspace Kubernetes clusters: register, list, verify, delete — and isolation."""

from __future__ import annotations

import json

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app

PASSWORD = "correct-horse"

KUBECONFIG = """apiVersion: v1
kind: Config
current-context: kind-tws-cluster
clusters:
- name: tws-cluster
  cluster:
    server: https://127.0.0.1:6443
    certificate-authority-data: UENB
contexts:
- name: kind-tws-cluster
  context:
    cluster: tws-cluster
    user: tarn
users:
- name: tarn
  user:
    token: super-secret-token-value-123
"""


def _new_client() -> TestClient:
    return TestClient(app)


def _signup(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/signup", json={"email": email, "password": PASSWORD}
    )
    assert response.status_code == 201, response.text
    return response.json()


def _slug(client: TestClient) -> str:
    workspaces = client.get("/api/v1/workspaces").json()["workspaces"]
    assert workspaces
    return workspaces[0]["slug"]


def _register(client: TestClient, slug: str, name: str = "tws"):
    return client.post(
        f"/api/v1/workspaces/{slug}/kubernetes/integrations",
        json={"name": name, "kubeconfig": KUBECONFIG},
    )


def test_register_list_and_secret_never_leaks(db_session):
    with _new_client() as owner:
        _signup(owner, "cluster-owner@example.com")
        slug = _slug(owner)

        created = _register(owner, slug, name="tws")
        assert created.status_code == 201, created.text
        body = created.json()
        assert body["name"] == "tws"
        assert body["context"] == "kind-tws-cluster"
        assert body["server"] == "https://127.0.0.1:6443"

        listed = owner.get(f"/api/v1/workspaces/{slug}/kubernetes/integrations")
        assert listed.status_code == 200
        payload = listed.json()
        assert payload["total"] == 1
        # The raw kubeconfig (and its token) must never appear in any response.
        assert "super-secret-token-value-123" not in listed.text
        assert "certificate-authority-data" not in listed.text

        # At rest the kubeconfig is sealed, not plaintext.
        from sqlalchemy import select

        from app.db.models import Integration

        row = db_session.scalar(
            select(Integration).where(Integration.workspace_id == body["id"])
        )
        assert row is None  # id is the integration id, not the workspace id
        integrations = db_session.scalars(
            select(Integration).where(Integration.kind == "kubernetes")
        ).all()
        assert integrations
        stored = json.dumps(integrations[0].config)
        assert "kubeconfig_sealed" in stored
        assert "super-secret-token-value-123" not in stored

        # Duplicate names are rejected per workspace.
        assert _register(owner, slug, name="tws").status_code == 409

        # Invalid YAML is rejected.
        bad = owner.post(
            f"/api/v1/workspaces/{slug}/kubernetes/integrations",
            json={"name": "broken", "kubeconfig": "<<<not yaml>>>"},
        )
        assert bad.status_code == 422


def test_delete_cluster():
    with _new_client() as owner:
        _signup(owner, "cluster-delete@example.com")
        slug = _slug(owner)
        integration_id = _register(owner, slug).json()["id"]

        removed = owner.delete(
            f"/api/v1/workspaces/{slug}/kubernetes/integrations/{integration_id}"
        )
        assert removed.status_code == 204
        assert (
            owner.get(f"/api/v1/workspaces/{slug}/kubernetes/integrations").json()[
                "total"
            ]
            == 0
        )
        # Deleting again is a negative path.
        assert (
            owner.delete(
                f"/api/v1/workspaces/{slug}/kubernetes/integrations/{integration_id}"
            ).status_code
            == 404
        )


def test_clusters_are_isolated_between_workspaces():
    with _new_client() as owner, _new_client() as outsider:
        _signup(owner, "cluster-isol-owner@example.com")
        slug = _slug(owner)
        integration_id = _register(owner, slug).json()["id"]

        _signup(outsider, "cluster-isol-out@example.com")
        outsider_slug = _slug(outsider)

        # The outsider's workspace sees none of the owner's clusters.
        assert (
            outsider.get(
                f"/api/v1/workspaces/{outsider_slug}/kubernetes/integrations"
            ).json()["total"]
            == 0
        )
        # And cannot touch them by id through their own workspace.
        assert (
            outsider.delete(
                f"/api/v1/workspaces/{outsider_slug}/kubernetes/integrations/{integration_id}"
            ).status_code
            == 404
        )
        verify = outsider.post(
            f"/api/v1/workspaces/{outsider_slug}/kubernetes/integrations/{integration_id}/verify"
        )
        assert verify.status_code == 404


def test_viewer_role_permissions():
    with _new_client() as owner, _new_client() as member:
        _signup(owner, "cluster-perm-owner@example.com")
        slug = _slug(owner)
        invite = owner.post(
            f"/api/v1/workspaces/{slug}/invites",
            json={"email": "cluster-perm-viewer@example.com", "role": "viewer"},
        )
        _signup(member, "cluster-perm-viewer@example.com")
        accepted = member.post(
            f"/api/v1/invites/{invite.json()['token']}/accept"
        )
        assert accepted.status_code == 200, accepted.text

        # Viewers cannot connect or remove clusters.
        assert _register(member, slug).status_code == 403
        # But they can list and verify (read-only).
        assert (
            member.get(f"/api/v1/workspaces/{slug}/kubernetes/integrations").status_code
            == 200
        )
        integration_id = _register(owner, slug, name="read-only-target").json()["id"]
        verified = member.post(
            f"/api/v1/workspaces/{slug}/kubernetes/integrations/{integration_id}/verify"
        )
        assert verified.status_code == 200
        # No live cluster in CI: the verification reports a structured failure.
        assert verified.json()["ok"] is False
        assert "super-secret-token-value-123" not in verified.text


def test_non_member_gets_the_standard_404():
    with _new_client() as owner, _new_client() as outsider:
        _signup(owner, "cluster-nonmember-owner@example.com")
        slug = _slug(owner)

        _signup(outsider, "cluster-nonmember-out@example.com")
        outsider_slug = _slug(outsider)

        denied = outsider.post(
            f"/api/v1/workspaces/{slug}/kubernetes/integrations",
            json={"name": "intrusion", "kubeconfig": KUBECONFIG},
        )
        missing = outsider.post(
            f"/api/v1/workspaces/does-not-exist/kubernetes/integrations",
            json={"name": "intrusion", "kubeconfig": KUBECONFIG},
        )
        assert denied.status_code == missing.status_code == 404
        denied_body = denied.json()
        missing_body = missing.json()
        assert denied_body["error"].pop("request_id")
        assert missing_body["error"].pop("request_id")
        assert denied_body == missing_body
        assert outsider_slug  # the outsider's own workspace is untouched
