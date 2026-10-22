"""Optional Google and GitHub OAuth (authorization-code flow).

Only fixed, well-known HTTPS endpoints are contacted. Credentials never leave
the server, errors are logged without tokens, and the application account is
linked by a provider-verified email address. OAuth remains disabled unless both
the client id and secret are configured.
"""

from __future__ import annotations

import json
import logging
import urllib.parse
import urllib.request
from typing import Any

from app.core.config import Settings

log = logging.getLogger("app.oauth")

_HTTP_TIMEOUT_SECONDS = 10
_MAX_RESPONSE_BYTES = 1_000_000

PROVIDER_NAMES = ("google", "github")


class OAuthError(Exception):
    """A safe, generic OAuth failure suitable for redirecting to the UI."""


def _get_json(url: str, *, headers: dict[str, str]) -> Any:
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=_HTTP_TIMEOUT_SECONDS) as response:  # nosec B310
            payload = response.read(_MAX_RESPONSE_BYTES)
    except Exception as exc:  # noqa: BLE001 - normalized to a safe error
        log.warning("OAuth userinfo request failed: %s", type(exc).__name__)
        raise OAuthError("The identity provider could not be reached.") from None
    try:
        return json.loads(payload)
    except (ValueError, TypeError):
        raise OAuthError("The identity provider returned an invalid response.") from None


def _post_json(url: str, *, data: dict[str, str], headers: dict[str, str]) -> dict[str, Any]:
    body = urllib.parse.urlencode(data).encode("utf-8")
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=_HTTP_TIMEOUT_SECONDS) as response:  # nosec B310
            payload = response.read(_MAX_RESPONSE_BYTES)
    except Exception as exc:  # noqa: BLE001
        log.warning("OAuth token exchange failed: %s", type(exc).__name__)
        raise OAuthError("The identity provider could not be reached.") from None
    try:
        parsed = json.loads(payload)
    except (ValueError, TypeError):
        raise OAuthError("The identity provider returned an invalid response.") from None
    if not isinstance(parsed, dict):
        raise OAuthError("The identity provider returned an invalid response.")
    return parsed


def redirect_uri(settings: Settings, provider: str) -> str:
    return f"{settings.oauth_redirect_base_url.rstrip('/')}/api/v1/auth/oauth/{provider}/callback"


def authorize_url(settings: Settings, provider: str, state: str) -> str:
    if provider == "google":
        params = {
            "client_id": settings.google_oauth_client_id or "",
            "redirect_uri": redirect_uri(settings, provider),
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account",
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    if provider == "github":
        params = {
            "client_id": settings.github_oauth_client_id or "",
            "redirect_uri": redirect_uri(settings, provider),
            "scope": "read:user user:email",
            "state": state,
        }
        return "https://github.com/login/oauth/authorize?" + urllib.parse.urlencode(params)
    raise OAuthError("Unsupported identity provider.")


def exchange_code(settings: Settings, provider: str, code: str) -> str:
    if provider == "google":
        data = _post_json(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_oauth_client_id or "",
                "client_secret": settings.google_oauth_client_secret or "",
                "redirect_uri": redirect_uri(settings, provider),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
    elif provider == "github":
        data = _post_json(
            "https://github.com/login/oauth/access_token",
            data={
                "code": code,
                "client_id": settings.github_oauth_client_id or "",
                "client_secret": settings.github_oauth_client_secret or "",
                "redirect_uri": redirect_uri(settings, provider),
            },
            headers={"Accept": "application/json"},
        )
    else:
        raise OAuthError("Unsupported identity provider.")
    token = data.get("access_token")
    if not isinstance(token, str) or not token:
        raise OAuthError("The identity provider did not return an access token.")
    return token


def fetch_profile(provider: str, access_token: str) -> dict[str, str | None]:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "User-Agent": "SRE-Copilot",
    }
    if provider == "google":
        data = _get_json("https://openidconnect.googleapis.com/v1/userinfo", headers=headers)
        if not isinstance(data, dict):
            raise OAuthError("The identity provider returned an invalid response.")
        if data.get("email_verified") is not True:
            raise OAuthError("The provider has not verified that email address.")
        subject = data.get("sub")
        email = data.get("email")
        name = data.get("name") or data.get("given_name")
        if not isinstance(subject, str) or not isinstance(email, str):
            raise OAuthError("The identity provider did not return an email address.")
        return {
            "subject": subject,
            "email": email,
            "display_name": name if isinstance(name, str) else None,
        }

    if provider == "github":
        user = _get_json("https://api.github.com/user", headers=headers)
        emails = _get_json("https://api.github.com/user/emails", headers=headers)
        if not isinstance(user, dict):
            raise OAuthError("The identity provider returned an invalid response.")
        # GitHub's /user endpoint may hide the email; /user/emails lists the
        # verified addresses. Prefer the primary verified address.
        chosen: dict[str, Any] | None = None
        if isinstance(emails, list):
            verified = [
                item
                for item in emails
                if isinstance(item, dict)
                and item.get("verified") is True
                and isinstance(item.get("email"), str)
            ]
            chosen = next(
                (item for item in verified if item.get("primary") is True),
                verified[0] if verified else None,
            )
        if chosen is None:
            raise OAuthError("The provider has not verified an email address.")
        subject = user.get("id")
        email = chosen.get("email")
        name = user.get("name") or user.get("login")
        if subject is None or not isinstance(email, str):
            raise OAuthError("The identity provider did not return an email address.")
        return {
            "subject": str(subject),
            "email": email,
            "display_name": name if isinstance(name, str) else None,
        }

    raise OAuthError("Unsupported identity provider.")
