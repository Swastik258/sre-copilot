"""OAuth provider discovery and state validation without outbound calls."""

from __future__ import annotations

from app.core.config import get_settings


def test_oauth_is_disabled_by_default_and_reports_configured_providers(client):
    settings = get_settings()
    previous_id = settings.google_oauth_client_id
    previous_secret = settings.google_oauth_client_secret
    try:
        settings.google_oauth_client_id = None
        settings.google_oauth_client_secret = None
        unavailable = client.get(
            "/api/v1/auth/oauth/google/start", follow_redirects=False
        )
        assert unavailable.status_code == 404
        assert client.get("/api/v1/auth/providers").json()["providers"] == []

        settings.google_oauth_client_id = "client-id"
        settings.google_oauth_client_secret = "client-secret"
        providers = client.get("/api/v1/auth/providers")
        assert providers.json()["providers"] == ["google"]
        start = client.get(
            "/api/v1/auth/oauth/google/start", follow_redirects=False
        )
        assert start.status_code == 302
        assert start.headers["location"].startswith(
            "https://accounts.google.com/o/oauth2/v2/auth?"
        )
        assert "sre_oauth_state" in client.cookies
    finally:
        settings.google_oauth_client_id = previous_id
        settings.google_oauth_client_secret = previous_secret


def test_oauth_callback_rejects_a_missing_state(client):
    response = client.get(
        "/api/v1/auth/oauth/google/callback?code=fake", follow_redirects=False
    )
    assert response.status_code == 303
    assert "oauth_error=oauth_state_invalid" in response.headers["location"]
