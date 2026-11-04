"""Core isolation deliverable.

User A in workspace A can never read, write, update or delete anything owned
by workspace B — through the API, a token, a URL or body parameter, an
export, or an error message. Proof is tests, not convention.
"""

from __future__ import annotations

import pytest
import sqlalchemy as sa
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import engine
from app.main import app

PASSWORD = "correct-horse"

SCOPED_TABLES = (
    "conversations",
    "messages",
    "integrations",
    "investigations",
    "evidence",
    "audit_events",
)


def _signup(email: str) -> TestClient:
    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/signup", json={"email": email, "password": PASSWORD}
    )
    assert response.status_code == 201, response.text
    return client


def _slug(client: TestClient) -> str:
    workspaces = client.get("/api/v1/workspaces").json()["workspaces"]
    assert workspaces
    return workspaces[0]["slug"]


def _workspace_id(client: TestClient) -> str:
    workspaces = client.get("/api/v1/workspaces").json()["workspaces"]
    return workspaces[0]["id"]


@pytest.fixture(scope="module")
def a_client() -> TestClient:
    return _signup("isol-a@example.com")


@pytest.fixture(scope="module")
def b_client() -> TestClient:
    return _signup("isol-b@example.com")


@pytest.fixture(scope="module")
def b_investigation_id(b_client: TestClient) -> str:
    slug = _slug(b_client)
    created = b_client.post(
        f"/api/v1/workspaces/{slug}/investigations",
        json={
            "title": "B secret investigation",
            "kind": "kubernetes",
            "environment": "prod",
            "target": "pod/b-secret",
        },
    )
    assert created.status_code == 201, created.text
    return created.json()["id"]


def test_a_cannot_read_b_investigations(a_client, b_client, b_investigation_id):
    b_slug = _slug(b_client)

    listing = a_client.get(f"/api/v1/workspaces/{b_slug}/investigations")
    assert listing.status_code == 404

    detail = a_client.get(
        f"/api/v1/workspaces/{b_slug}/investigations/{b_investigation_id}"
    )
    assert detail.status_code == 404

    messages = a_client.get(
        f"/api/v1/workspaces/{b_slug}/investigations/{b_investigation_id}/messages"
    )
    assert messages.status_code == 404

    evidence = a_client.get(
        f"/api/v1/workspaces/{b_slug}/investigations/{b_investigation_id}/evidence"
    )
    assert evidence.status_code == 404


def test_a_cannot_write_update_or_delete_b_investigations(
    a_client, b_client, b_investigation_id
):
    b_slug = _slug(b_client)
    base = f"/api/v1/workspaces/{b_slug}/investigations/{b_investigation_id}"

    assert (
        a_client.post(
            f"/api/v1/workspaces/{b_slug}/investigations",
            json={"title": "intrusion", "kind": "kubernetes"},
        ).status_code
        == 404
    )
    assert (
        a_client.post(f"{base}/messages", json={"content": "intrusion"}).status_code
        == 404
    )
    assert a_client.post(f"{base}/close").status_code == 404


def test_a_cannot_read_or_diagnose_b_kubernetes(a_client, b_client):
    b_slug = _slug(b_client)
    base = f"/api/v1/workspaces/{b_slug}/kubernetes"

    assert a_client.get(f"{base}/clusters").status_code == 404
    assert a_client.get(f"{base}/pods").status_code == 404
    assert (
        a_client.post(f"{base}/pods/prod/some-pod/diagnose").status_code == 404
    )


def test_a_cannot_read_b_audit_events(a_client, b_client):
    b_slug = _slug(b_client)
    listing = a_client.get(f"/api/v1/workspaces/{b_slug}/audit-events")
    assert listing.status_code == 404


def test_a_cannot_export_b_audit_csv(a_client, b_client):
    b_slug = _slug(b_client)
    export = a_client.get(f"/api/v1/workspaces/{b_slug}/audit-events/export.csv")
    assert export.status_code == 404


def test_nonexistent_and_foreign_workspace_404s_are_identical(
    a_client, b_client
):
    b_slug = _slug(b_client)
    foreign = a_client.get(f"/api/v1/workspaces/{b_slug}/investigations")
    missing = a_client.get("/api/v1/workspaces/does-not-exist/investigations")

    assert foreign.status_code == missing.status_code == 404
    assert foreign.content == missing.content
    assert foreign.headers.get("content-type") == missing.headers.get(
        "content-type"
    )


def test_legacy_header_cannot_select_foreign_workspace(a_client, b_client):
    b_workspace_id = _workspace_id(b_client)

    foreign = a_client.get(
        "/api/v1/investigations", headers={"X-Workspace-Id": b_workspace_id}
    )
    missing = a_client.get(
        "/api/v1/investigations",
        headers={"X-Workspace-Id": "00000000-0000-0000-0000-000000000000"},
    )

    assert foreign.status_code == 404
    assert missing.status_code == 404
    assert foreign.content == missing.content


def test_workspace_id_in_body_or_query_is_ignored(
    a_client, b_client, b_investigation_id, db_session
):
    from app.db.models import Investigation

    a_workspace_id = _workspace_id(a_client)
    a_slug = _slug(a_client)

    created = a_client.post(
        f"/api/v1/workspaces/{a_slug}/investigations",
        json={
            "title": "A investigation",
            "kind": "kubernetes",
            "workspace_id": _workspace_id(b_client),
        },
    )
    assert created.status_code in {201, 422}
    if created.status_code == 201:
        row = db_session.get(Investigation, created.json()["id"])
        db_session.refresh(row)
        assert row.workspace_id == a_workspace_id

    listed = a_client.get(
        f"/api/v1/workspaces/{a_slug}/investigations",
        params={"workspace_id": _workspace_id(b_client)},
    )
    assert listed.status_code == 200
    ids = [item["id"] for item in listed.json()["investigations"]]
    assert b_investigation_id not in ids


def test_every_scoped_table_requires_workspace_id(db_session):
    workspaces = Base.metadata.tables["workspaces"]

    for table_name in SCOPED_TABLES:
        table = Base.metadata.tables[table_name]
        assert "workspace_id" in table.columns, table_name
        column = table.columns["workspace_id"]
        assert column.nullable is False, table_name
        assert column.foreign_keys, table_name
        target = next(iter(column.foreign_keys)).column
        assert target.table is workspaces, table_name

    inspector = sa.inspect(engine)
    for table_name in SCOPED_TABLES:
        columns = {c["name"]: c for c in inspector.get_columns(table_name)}
        assert "workspace_id" in columns, table_name
        assert columns["workspace_id"]["nullable"] is False, table_name


def test_member_of_b_still_sees_own_data(b_client, b_investigation_id):
    b_slug = _slug(b_client)
    detail = b_client.get(
        f"/api/v1/workspaces/{b_slug}/investigations/{b_investigation_id}"
    )
    assert detail.status_code == 200
    assert detail.json()["id"] == b_investigation_id
