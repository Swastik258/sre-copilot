"""A minimal in-memory rate limiter and request-size guard.

These are deliberately small and dependency-free. The limiter is a per-client
sliding window kept in process memory, which is appropriate for a single-instance
local/demo deployment. A multi-instance production deployment should move this
to a shared store (for example Redis) — see docs/SECURITY.md.

The limiter is disabled when ``rate_limit_per_minute <= 0``.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from app.core.request_context import get_request_id

# Paths that should never be rate limited or size checked internally.
_EXEMPT_PREFIXES = ("/api/v1/health", "/health", "/docs", "/redoc", "/openapi.json")


def _client_key(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, *, limit_per_minute: int) -> None:
        super().__init__(app)
        self.limit = limit_per_minute
        self.window_seconds = 60.0
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if self.limit <= 0 or request.url.path.startswith(_EXEMPT_PREFIXES) or request.method == "OPTIONS":
            return await call_next(request)

        now = time.monotonic()
        window_start = now - self.window_seconds
        hits = self._hits[_client_key(request)]
        while hits and hits[0] < window_start:
            hits.popleft()

        if len(hits) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "rate_limited",
                        "message": "Too many requests",
                        "details": {"limit_per_minute": self.limit},
                        "request_id": get_request_id(),
                    }
                },
            )
        hits.append(now)
        return await call_next(request)


class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    """Reject requests whose declared body exceeds the configured cap."""

    def __init__(self, app: ASGIApp, *, max_bytes: int) -> None:
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        content_length = request.headers.get("content-length")
        if self.max_bytes > 0 and content_length is not None:
            try:
                if int(content_length) > self.max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": {
                                "code": "payload_too_large",
                                "message": "Request body exceeds the configured limit",
                                "details": {"max_request_bytes": self.max_bytes},
                                "request_id": get_request_id(),
                            }
                        },
                    )
            except ValueError:
                pass
        return await call_next(request)
