"""CSRF double-submit and origin checks in production mode."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.csrf import CSRFMiddleware


def _client() -> TestClient:
    settings = Settings(
        csrf_protection=True,
        cors_origins="https://app.example.com",
        app_base_url="https://app.example.com",
    )
    app = FastAPI()
    app.add_middleware(CSRFMiddleware, settings=settings)

    @app.post("/write")
    def write() -> dict[str, bool]:
        return {"ok": True}

    @app.get("/read")
    def read() -> dict[str, bool]:
        return {"ok": True}

    return TestClient(app)


def test_cookie_write_requires_matching_csrf_header() -> None:
    client = _client()
    client.cookies.set("sre_session", "session-token")
    client.cookies.set("sre_csrf", "csrf-token")
    headers = {"Origin": "https://app.example.com"}

    missing = client.post("/write", headers=headers)
    assert missing.status_code == 403
    assert missing.json()["error"]["code"] == "csrf_token_invalid"

    wrong = client.post(
        "/write", headers={**headers, "X-CSRF-Token": "different-token"}
    )
    assert wrong.status_code == 403

    allowed = client.post(
        "/write", headers={**headers, "X-CSRF-Token": "csrf-token"}
    )
    assert allowed.status_code == 200


def test_origin_is_checked_for_browser_writes() -> None:
    client = _client()
    client.cookies.set("sre_session", "session-token")
    client.cookies.set("sre_csrf", "csrf-token")
    response = client.post(
        "/write",
        headers={
            "Origin": "https://evil.example.com",
            "X-CSRF-Token": "csrf-token",
        },
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "csrf_origin_rejected"


def test_missing_origin_is_rejected_for_cookie_sessions() -> None:
    client = _client()
    client.cookies.set("sre_session", "session-token")
    client.cookies.set("sre_csrf", "csrf-token")
    response = client.post("/write", headers={"X-CSRF-Token": "csrf-token"})
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "csrf_origin_missing"


def test_bearer_clients_and_safe_methods_are_not_affected() -> None:
    client = _client()
    assert client.get("/read").status_code == 200
    # No session cookie means no ambient authority to forge.
    assert client.post("/write").status_code == 200
