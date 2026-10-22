"""Generic Idempotency-Key behavior for mutating API requests."""

from __future__ import annotations


def _signup(client, email: str) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "correct-horse", "display_name": "Ada"},
    )
    assert response.status_code == 201, response.text


def test_create_is_replayed_and_conflicting_reuse_is_rejected(client) -> None:
    _signup(client, "idempotency@example.com")
    headers = {"Idempotency-Key": "investigation-key-0001"}
    payload = {"title": "Retry-safe investigation", "kind": "logs"}

    first = client.post("/api/v1/investigations", json=payload, headers=headers)
    assert first.status_code == 201, first.text
    assert first.headers.get("idempotency-replayed") is None

    second = client.post("/api/v1/investigations", json=payload, headers=headers)
    assert second.status_code == 201, second.text
    assert second.headers["idempotency-replayed"] == "true"
    assert second.json()["id"] == first.json()["id"]

    listing = client.get("/api/v1/investigations")
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    conflict = client.post(
        "/api/v1/investigations",
        json={"title": "Different payload", "kind": "logs"},
        headers=headers,
    )
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "idempotency_conflict"


def test_invalid_idempotency_key_is_rejected_before_the_route(client) -> None:
    _signup(client, "bad-key@example.com")
    response = client.post(
        "/api/v1/investigations",
        json={"title": "x", "kind": "logs"},
        headers={"Idempotency-Key": "short"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_auth_routes_are_not_cached(client) -> None:
    headers = {"Idempotency-Key": "signup-key-000001"}
    payload = {
        "email": "not-cached@example.com",
        "password": "correct-horse",
        "display_name": "Ada",
    }
    first = client.post("/api/v1/auth/signup", json=payload, headers=headers)
    second = client.post("/api/v1/auth/signup", json=payload, headers=headers)
    assert first.status_code == 201
    assert second.status_code == 409
    assert second.headers.get("idempotency-replayed") is None
