"""Request-size guard and proxy-aware in-memory rate limiting.

The rate limiter remains per process. It is appropriate for a single instance or
as a coarse backstop behind an edge limiter; production multi-instance
deployments should also enforce limits at the ingress/Redis layer.
"""

from __future__ import annotations

import ipaddress
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.request_context import get_request_id

_EXEMPT_PREFIXES = (
    "/api/v1/health",
    "/health",
    "/api/docs",
    "/api/redoc",
    "/api/openapi.json",
    "/docs",
    "/redoc",
    "/openapi.json",
)
_AUTH_PATH_PREFIX = "/api/v1/auth/"
_UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def _valid_ip(value: str) -> str | None:
    try:
        return str(ipaddress.ip_address(value.strip()))
    except ValueError:
        return None


def _client_key(request: Request, trusted_proxies: set[str]) -> str:
    peer = request.client.host if request.client and request.client.host else "unknown"
    if peer not in trusted_proxies:
        return peer
    forwarded = request.headers.get("x-forwarded-for", "")
    candidates = [item.strip() for item in forwarded.split(",") if item.strip()]
    # The proxy appends to the right. Walk from the nearest hop outward and use
    # the first address that is not itself a trusted proxy.
    for candidate in reversed(candidates):
        address = _valid_ip(candidate)
        if address and address not in trusted_proxies:
            return address
    return peer


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        *,
        limit_per_minute: int,
        auth_limit_per_minute: int = 0,
        trusted_proxies: list[str] | None = None,
    ) -> None:
        super().__init__(app)
        self.limit = limit_per_minute
        self.auth_limit = auth_limit_per_minute
        self.window_seconds = 60.0
        self.trusted_proxies = set(trusted_proxies or [])
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if request.url.path.startswith(_EXEMPT_PREFIXES) or request.method == "OPTIONS":
            return await call_next(request)
        is_auth = (
            request.url.path.startswith(_AUTH_PATH_PREFIX)
            and request.method in _UNSAFE_METHODS
        )
        limit = self.auth_limit if is_auth else self.limit
        if limit <= 0:
            return await call_next(request)

        now = time.monotonic()
        window_start = now - self.window_seconds
        client = _client_key(request, self.trusted_proxies)
        bucket = f"auth:{client}" if is_auth else f"api:{client}"
        hits = self._hits[bucket]
        while hits and hits[0] < window_start:
            hits.popleft()
        response_headers = {
            "RateLimit-Limit": str(limit),
            "RateLimit-Remaining": str(max(0, limit - len(hits) - 1)),
            "RateLimit-Reset": str(int(self.window_seconds)),
        }
        if len(hits) >= limit:
            return JSONResponse(
                status_code=429,
                headers={
                    **response_headers,
                    "RateLimit-Remaining": "0",
                    "Retry-After": str(int(self.window_seconds)),
                },
                content={
                    "error": {
                        "code": "rate_limited",
                        "message": "Too many requests",
                        "details": {"limit_per_minute": limit},
                        "request_id": get_request_id(),
                    }
                },
            )
        hits.append(now)
        self._trim(now)
        response = await call_next(request)
        for name, value in response_headers.items():
            response.headers.setdefault(name, value)
        return response

    def _trim(self, now: float) -> None:
        if len(self._hits) <= 10_000:
            return
        window_start = now - self.window_seconds
        for key, hits in list(self._hits.items()):
            while hits and hits[0] < window_start:
                hits.popleft()
            if not hits:
                self._hits.pop(key, None)


class MaxBodySizeMiddleware:
    """Enforce a streaming body cap, not just the declared Content-Length."""

    def __init__(self, app: ASGIApp, *, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or self.max_bytes <= 0:
            await self.app(scope, receive, send)
            return

        headers = {k.lower(): v for k, v in scope.get("headers", [])}
        declared = headers.get(b"content-length")
        if declared:
            try:
                if int(declared) > self.max_bytes:
                    await self._reject(send)
                    return
            except ValueError:
                await self._reject(send, message="Invalid Content-Length header.")
                return

        messages: list[Message] = []
        total = 0
        while True:
            message = await receive()
            messages.append(message)
            if message["type"] == "http.disconnect":
                break
            if message["type"] != "http.request":
                continue
            total += len(message.get("body", b""))
            if total > self.max_bytes:
                await self._reject(send)
                return
            if not message.get("more_body", False):
                break

        index = 0

        async def replay() -> Message:
            nonlocal index
            if index < len(messages):
                item = messages[index]
                index += 1
                return item
            return {"type": "http.disconnect"}

        await self.app(scope, replay, send)

    async def _reject(
        self, send: Send, *, message: str = "Request body exceeds the configured limit"
    ) -> None:
        import json

        body = json.dumps(
            {
                "error": {
                    "code": "payload_too_large",
                    "message": message,
                    "details": {"max_request_bytes": self.max_bytes},
                    "request_id": get_request_id(),
                }
            },
            separators=(",", ":"),
        ).encode()
        await send(
            {
                "type": "http.response.start",
                "status": 413,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"connection", b"close"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})
