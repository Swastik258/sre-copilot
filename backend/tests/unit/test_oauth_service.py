"""OAuth service normalization and provider profile validation."""

from __future__ import annotations

import json

import pytest

from app.core.config import Settings
from app.services import oauth


class _Response:
    def __init__(self, payload: bytes) -> None:
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, _limit: int) -> bytes:
        return self.payload


def _settings() -> Settings:
    return Settings(
        google_oauth_client_id="google-id",
        google_oauth_client_secret="google-secret",
        github_oauth_client_id="github-id",
        github_oauth_client_secret="github-secret",
        oauth_redirect_base_url="https://app.example.com/",
    )


def test_authorize_urls_and_redirect_uri() -> None:
    settings = _settings()
    assert oauth.redirect_uri(settings, "google") == (
        "https://app.example.com/api/v1/auth/oauth/google/callback"
    )
    google = oauth.authorize_url(settings, "google", "state-1")
    assert google.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
    assert "state=state-1" in google
    github = oauth.authorize_url(settings, "github", "state-2")
    assert github.startswith("https://github.com/login/oauth/authorize?")
    assert "scope=read%3Auser+user%3Aemail" in github
    with pytest.raises(oauth.OAuthError):
        oauth.authorize_url(settings, "unknown", "state")


def test_exchange_code_requires_a_token(monkeypatch) -> None:
    settings = _settings()
    monkeypatch.setattr(oauth, "_post_json", lambda *args, **kwargs: {"access_token": "token-1"})
    assert oauth.exchange_code(settings, "google", "code") == "token-1"
    assert oauth.exchange_code(settings, "github", "code") == "token-1"
    monkeypatch.setattr(oauth, "_post_json", lambda *args, **kwargs: {})
    with pytest.raises(oauth.OAuthError, match="access token"):
        oauth.exchange_code(settings, "google", "code")
    with pytest.raises(oauth.OAuthError, match="Unsupported"):
        oauth.exchange_code(settings, "unknown", "code")


def test_json_helpers_normalize_transport_and_shape_errors(monkeypatch) -> None:
    monkeypatch.setattr(
        oauth.urllib.request,
        "urlopen",
        lambda *_args, **_kwargs: _Response(json.dumps({"ok": True}).encode()),
    )
    assert oauth._get_json("https://example.com", headers={}) == {"ok": True}
    monkeypatch.setattr(
        oauth.urllib.request,
        "urlopen",
        lambda *_args, **_kwargs: _Response(b"not-json"),
    )
    with pytest.raises(oauth.OAuthError, match="invalid response"):
        oauth._get_json("https://example.com", headers={})
    with pytest.raises(oauth.OAuthError, match="invalid response"):
        oauth._post_json("https://example.com", data={}, headers={})
    monkeypatch.setattr(
        oauth.urllib.request,
        "urlopen",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(TimeoutError()),
    )
    with pytest.raises(oauth.OAuthError, match="could not be reached"):
        oauth._get_json("https://example.com", headers={})
    with pytest.raises(oauth.OAuthError, match="could not be reached"):
        oauth._post_json("https://example.com", data={}, headers={})


def test_google_profile_requires_verified_email(monkeypatch) -> None:
    monkeypatch.setattr(
        oauth,
        "_get_json",
        lambda *_args, **_kwargs: {
            "sub": "google-sub",
            "email": "ada@example.com",
            "email_verified": True,
            "name": "Ada",
        },
    )
    assert oauth.fetch_profile("google", "token") == {
        "subject": "google-sub",
        "email": "ada@example.com",
        "display_name": "Ada",
    }
    monkeypatch.setattr(
        oauth,
        "_get_json",
        lambda *_args, **_kwargs: {
            "sub": "google-sub",
            "email": "ada@example.com",
            "email_verified": False,
        },
    )
    with pytest.raises(oauth.OAuthError, match="not verified"):
        oauth.fetch_profile("google", "token")


def test_github_profile_prefers_primary_verified_email(monkeypatch) -> None:
    payloads = iter(
        [
            {"id": 7, "login": "octo", "name": "Octo"},
            [
                {"email": "secondary@example.com", "verified": True, "primary": False},
                {"email": "primary@example.com", "verified": True, "primary": True},
                {"email": "unverified@example.com", "verified": False, "primary": False},
            ],
        ]
    )
    monkeypatch.setattr(oauth, "_get_json", lambda *_args, **_kwargs: next(payloads))
    assert oauth.fetch_profile("github", "token") == {
        "subject": "7",
        "email": "primary@example.com",
        "display_name": "Octo",
    }

    payloads = iter([{"id": 7}, [{"email": "x@example.com", "verified": False}]])
    monkeypatch.setattr(oauth, "_get_json", lambda *_args, **_kwargs: next(payloads))
    with pytest.raises(oauth.OAuthError, match="verified an email"):
        oauth.fetch_profile("github", "token")
