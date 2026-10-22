"""Application error types and consistent JSON error responses.

Every error returned by the API uses the same envelope::

    {
      "error": {
        "code": "not_found",
        "message": "Investigation not found",
        "details": {...} | null,
        "request_id": "..." | null
      }
    }

Internal exceptions never leak stack traces or secrets to clients.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.request_context import get_request_id

log = logging.getLogger(__name__)


class AppError(Exception):
    """Base class for expected, client-safe application errors."""

    status_code: int = 400
    code: str = "bad_request"

    def __init__(
        self,
        message: str,
        *,
        code: str | None = None,
        status_code: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code
        self.details = details


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ValidationError(AppError):
    status_code = 422
    code = "validation_error"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class NotConfiguredError(AppError):
    """Raised when an integration is requested but not configured."""

    status_code = 503
    code = "not_configured"


class AIProviderError(AppError):
    """Raised when an external AI provider fails or returns unusable output."""

    status_code = 502
    code = "ai_provider_error"


class GitHubAPIError(AppError):
    """Raised when GitHub rejects or fails a read-only API request."""

    status_code = 502
    code = "github_api_error"


class PrometheusAPIError(AppError):
    """Raised when a read-only Prometheus query fails."""

    status_code = 502
    code = "prometheus_api_error"


class PermissionDeniedError(AppError):
    status_code = 403
    code = "permission_denied"


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"


class RateLimitedError(AppError):
    status_code = 429
    code = "rate_limited"


def _envelope(
    *,
    code: str,
    message: str,
    details: Any = None,
    request_id: str | None = None,
) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details,
            "request_id": request_id,
        }
    }


def _safe_validation_errors(errors: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
    """Make pydantic's error list JSON-serializable.

    Pydantic puts the raised exception object (e.g. ``ValueError``) into the
    ``ctx`` of errors produced by custom validators. That object is not JSON
    serializable, so the error envelope would itself fail with a 500. Keep the
    human-readable message and stringify anything else.
    """
    cleaned: list[dict[str, Any]] = []
    for error in errors:
        item = dict(error)
        ctx = item.get("ctx")
        if isinstance(ctx, dict):
            item["ctx"] = {
                key: value
                if isinstance(value, (str, int, float, bool)) or value is None
                else str(value)
                for key, value in ctx.items()
            }
        cleaned.append(item)
    return cleaned


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(
                code=exc.code,
                message=exc.message,
                details=exc.details,
                request_id=get_request_id(),
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=_envelope(
                code="validation_error",
                message="Request validation failed",
                details={"errors": _safe_validation_errors(exc.errors())},
                request_id=get_request_id(),
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(
                code=f"http_{exc.status_code}",
                message=str(exc.detail),
                request_id=get_request_id(),
            ),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        log.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=_envelope(
                code="internal_error",
                message="An unexpected error occurred",
                request_id=get_request_id(),
            ),
        )
