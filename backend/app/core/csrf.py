"""CSRF and cross-origin write protection.

Cookie-authenticated browsers use a double-submit token: the server sets a
random value in a readable cookie and requires the same value in
``X-CSRF-Token`` for every unsafe request. The origin/referer is also checked
against the configured frontend allow-list, which covers older clients that do
not yet send the header.

Production always enables this middleware. Local/test environments can opt in
with ``CSRF_PROTECTION=true``; tests that exercise the API directly remain
unaffected by default. Bearer/API-key requests do not rely on ambient cookies
and therefore do not need a CSRF header.
"""

from __future__ import annotations

import hmac
from urllib.parse import urlsplit

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from app.core.config import Settings
from app.core.request_context import get_request_id

_UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _origin(value: str | None) -> str | None:
    if not value:
        return None
    try:
        parsed = urlsplit(value)
    except ValueError:
        return None
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}".lower()


class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, *, settings: Settings) -> None:
        super().__init__(app)
        self.settings = settings
        allowed = {o.rstrip("/").lower() for o in settings.cors_origin_list}
        base = _origin(settings.app_base_url)
        if base:
            allowed.add(base)
        self.allowed_origins = allowed

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if not self.settings.effective_csrf_protection:
            return await call_next(request)
        if request.method not in _UNSAFE_METHODS:
            return await call_next(request)

        origin = _origin(request.headers.get("origin"))
        referer = _origin(request.headers.get("referer"))
        presented = origin or referer
        if presented is not None and presented not in self.allowed_origins:
            return self._reject(
                "Cross-origin request rejected.", code="csrf_origin_rejected"
            )

        has_session_cookie = bool(
            request.cookies.get(self.settings.auth_cookie_name)
        )
        if has_session_cookie:
            if presented is None:
                return self._reject(
                    "Origin or Referer header required.", code="csrf_origin_missing"
                )
            cookie_token = request.cookies.get(self.settings.auth_csrf_cookie_name, "")
            header_token = request.headers.get(
                self.settings.auth_csrf_header_name, ""
            )
            if not cookie_token or not header_token or not hmac.compare_digest(
                cookie_token, header_token
            ):
                return self._reject(
                    "CSRF token missing or invalid.", code="csrf_token_invalid"
                )
        return await call_next(request)

    @staticmethod
    def _reject(message: str, *, code: str) -> JSONResponse:
        return JSONResponse(
            status_code=403,
            content={
                "error": {
                    "code": code,
                    "message": message,
                    "details": None,
                    "request_id": get_request_id(),
                }
            },
        )
