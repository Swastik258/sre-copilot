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
        unavailable = client.get("/api/v1/auth/oauth/google/start", follow_redirects=False)
        assert unavailable.status_code == 404
        assert client.get("/api/v1/auth/providers").json()["providers"] == []

        settings.google_oauth_client_id = "client-id"
        settings.google_oauth_client_secret = "client-secret"
        providers = client.get("/api/v1/auth/providers")
        assert providers.json()["providers"] == ["google"]
        start = client.get("/api/v1/auth/oauth/google/start", follow_redirects=False)
        assert start.status_code == 302
        assert start.headers["location"].startswith("https://accounts.google.com/o/oauth2/v2/auth?")
        assert "sre_oauth_state" in client.cookies
    finally:
        settings.google_oauth_client_id = previous_id
        settings.google_oauth_client_secret = previous_secret


def test_oauth_callback_rejects_a_missing_state(client):
    response = client.get("/api/v1/auth/oauth/google/callback?code=fake", follow_redirects=False)
    assert response.status_code == 303
    assert "oauth_error=oauth_state_invalid" in response.headers["location"]


def test_oauth_callback_links_a_verified_provider_account(client, monkeypatch) -> None:
    from app.services import oauth as oauth_service

    settings = get_settings()
    previous_id = settings.google_oauth_client_id
    previous_secret = settings.google_oauth_client_secret
    settings.google_oauth_client_id = "client-id"
    settings.google_oauth_client_secret = "client-secret"
    try:
        start = client.get("/api/v1/auth/oauth/google/start", follow_redirects=False)
        assert start.status_code == 302
        state = client.cookies.get("sre_oauth_state")
        assert state
        monkeypatch.setattr(
            oauth_service, "exchange_code", lambda *_args, **_kwargs: "access-token"
        )
        monkeypatch.setattr(
            oauth_service,
            "fetch_profile",
            lambda *_args, **_kwargs: {
                "subject": "provider-123",
                "email": "oauth-new@example.com",
                "display_name": "OAuth User",
            },
        )
        callback = client.get(
            f"/api/v1/auth/oauth/google/callback?code=code&state={state}",
            follow_redirects=False,
        )
        assert callback.status_code == 303
        assert callback.headers["location"].endswith("/dashboard")
        me = client.get("/api/v1/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == "oauth-new@example.com"

        start = client.get("/api/v1/auth/oauth/google/start", follow_redirects=False)
        state = client.cookies.get("sre_oauth_state")
        monkeypatch.setattr(
            oauth_service,
            "exchange_code",
            lambda *_args, **_kwargs: (_ for _ in ()).throw(
                oauth_service.OAuthError("provider down")
            ),
        )
        failed = client.get(
            f"/api/v1/auth/oauth/google/callback?code=code&state={state}",
            follow_redirects=False,
        )
        assert failed.status_code == 303
        assert "oauth_error=oauth_failed" in failed.headers["location"]
    finally:
        settings.google_oauth_client_id = previous_id
        settings.google_oauth_client_secret = previous_secret
