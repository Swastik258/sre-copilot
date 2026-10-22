"""Request correlation IDs and request-scoped context.

Every request gets a correlation ID (either supplied by the caller via the
``X-Request-ID`` header or generated). It is stored in a context variable so
that log records and audit events can be tied back to the originating request,
and echoed back in the ``X-Request-ID`` response header.
"""

from __future__ import annotations

import re
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")

_request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)


def new_request_id() -> str:
    return str(uuid.uuid4())


def get_request_id() -> str | None:
    return _request_id_ctx.get()


def set_request_id(value: str | None) -> None:
    _request_id_ctx.set(value)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assign a correlation ID to each request and expose it downstream."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        incoming = (request.headers.get(REQUEST_ID_HEADER) or "").strip()
        request_id = incoming if _REQUEST_ID_RE.fullmatch(incoming) else new_request_id()

        token = _request_id_ctx.set(request_id)
        try:
            response: Response = await call_next(request)
        finally:
            _request_id_ctx.reset(token)

        response.headers[REQUEST_ID_HEADER] = request_id
        return response
