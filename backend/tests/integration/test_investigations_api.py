"""Integration tests for persisted investigations and assistant messages."""

from __future__ import annotations

from datetime import UTC, datetime

from app.db.models import Evidence as EvidenceModel

SIGNUP = "/api/v1/auth/signup"
INVESTIGATIONS = "/api/v1/investigations"


def _signup(client, email: str) -> None:
    response = client.post(
        SIGNUP,
        json={"email": email, "password": "correct-horse", "display_name": "Ada"},
    )
    assert response.status_code == 201, response.text


def _create(client, title: str = "Checkout failure") -> dict:
    response = client.post(
        INVESTIGATIONS,
        json={"title": title, "kind": "kubernetes", "environment": "production"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_investigation_lifecycle_and_message_persistence(client, db_session) -> None:
    _signup(client, "investigator@example.com")
    created = _create(client)
    investigation_id = created["id"]

    evidence = EvidenceModel(
        investigation_id=investigation_id,
        source_type="kubernetes",
        source_resource="default/checkout",
        environment="production",
        severity="high",
        summary="Container is in CrashLoopBackOff.",
        collected_at=datetime.now(UTC),
        redacted=True,
        demo=False,
    )
    db_session.add(evidence)
    db_session.commit()

    listing = client.get(INVESTIGATIONS)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["investigations"][0]["id"] == investigation_id

    exchange = client.post(
        f"{INVESTIGATIONS}/{investigation_id}/messages",
        json={"content": "Why is checkout failing?"},
    )
    assert exchange.status_code == 200, exchange.text
    body = exchange.json()
    assert body["user_message"]["role"] == "user"
    assert body["assistant_message"]["role"] == "assistant"
    assert body["diagnosis"]["evidence_ids"] == [evidence.id]
    assert body["assistant_message"]["diagnosis"]["model_provider"] == "mock"

    history = client.get(f"{INVESTIGATIONS}/{investigation_id}/messages")
    assert history.status_code == 200
    assert len(history.json()["messages"]) == 2
    assert history.json()["messages"][0]["content"] == "Why is checkout failing?"

    detail = client.get(f"{INVESTIGATIONS}/{investigation_id}")
    assert detail.status_code == 200
    assert detail.json()["message_count"] == 2
    assert detail.json()["status"] == "in_progress"


def test_investigations_are_scoped_to_the_signed_in_user(client) -> None:
    _signup(client, "owner@example.com")
    created = _create(client, "Owner investigation")
    client.cookies.clear()

    _signup(client, "other@example.com")
    response = client.get(f"{INVESTIGATIONS}/{created['id']}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_investigations_require_authentication(client) -> None:
    client.cookies.clear()
    response = client.get(INVESTIGATIONS)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"
