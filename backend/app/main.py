"""FastAPI application entrypoint.

Wires configuration, structured logging, correlation IDs, request limits,
consistent error handling and the versioned API router.
"""

from __future__ import annotations

import logging
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.csrf import CSRFMiddleware
from app.core.errors import NotFoundError, UnauthorizedError, register_exception_handlers
from app.core.idempotency import IdempotencyMiddleware
from app.core.logging import configure_logging
from app.core.observability import ObservabilityMiddleware
from app.core.prom_metrics import CONTENT_TYPE as PROMETHEUS_CONTENT_TYPE
from app.core.prom_metrics import render as render_prometheus_metrics
from app.core.ratelimit import MaxBodySizeMiddleware, RateLimitMiddleware
from app.core.request_context import RequestContextMiddleware
from app.core.security import SecurityHeadersMiddleware
from app.core.telemetry import configure_telemetry, shutdown_telemetry

configure_logging()

settings = get_settings()
log = logging.getLogger("app")

_runtime_errors = settings.runtime_config_errors()
if _runtime_errors:
    raise RuntimeError("Unsafe runtime configuration: " + " ".join(_runtime_errors))

configure_telemetry(settings)


def _ensure_local_schema() -> None:
    """Create tables automatically for local SQLite only.

    This keeps the demo experience zero-setup. Postgres (and any non-local
    environment) must rely on Alembic migrations instead.
    """

    if settings.auto_create_schema and settings.is_sqlite and settings.is_local:
        from app.db.base import Base  # noqa: WPS433 (intentional local import)
        from app.db.local_schema import upgrade_local_sqlite_schema
        from app.db.session import engine

        Base.metadata.create_all(engine)
        # create_all() cannot add a column to an existing table, so a DB from an
        # earlier milestone would break signup. Apply additive upgrades here.
        applied = upgrade_local_sqlite_schema(engine)
        if applied:
            log.info("Upgraded local SQLite schema: %s", ", ".join(applied))
        log.info("Ensured local SQLite schema exists")


@asynccontextmanager
async def lifespan(_: FastAPI):
    _ensure_local_schema()
    worker = None
    if settings.effective_background_jobs:
        from app.db.session import SessionLocal
        from app.services.job_handlers import schedule_maintenance_jobs
        from app.services.jobs import BackgroundWorker

        db = SessionLocal()
        try:
            schedule_maintenance_jobs(db)
        except Exception:  # noqa: BLE001 - startup continues with a clear log
            log.exception("Could not schedule maintenance jobs")
            db.rollback()
        finally:
            db.close()
        worker = BackgroundWorker()
        worker.start()
    try:
        yield
    finally:
        if worker is not None:
            worker.stop()
        from app.db.session import engine

        engine.dispose()
        shutdown_telemetry()
        log.info("Database connections released")


app = FastAPI(
    title="SRE Copilot API",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    description=(
        "Evidence-backed, read-only infrastructure diagnosis. "
        "Interactive schema documentation is served at /api/docs."
    ),
)

# Order matters: the last middleware added is the outermost. Idempotency sits
# inside the body limit and rate limiter, and outside the application so it can
# capture/replay the final JSON response.
app.add_middleware(IdempotencyMiddleware)
app.add_middleware(MaxBodySizeMiddleware, max_bytes=settings.max_request_bytes)
app.add_middleware(
    RateLimitMiddleware,
    limit_per_minute=settings.effective_rate_limit,
    auth_limit_per_minute=settings.effective_auth_rate_limit,
    trusted_proxies=settings.trusted_proxy_list,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.allow_credentials,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-Request-ID",
        "X-CSRF-Token",
    ],
    expose_headers=[
        "X-Request-ID",
        "Idempotency-Replayed",
        "RateLimit-Limit",
        "RateLimit-Remaining",
        "RateLimit-Reset",
        "Retry-After",
    ],
    max_age=600,
)
if settings.effective_csrf_protection:
    app.add_middleware(CSRFMiddleware, settings=settings)
if settings.security_headers_enabled:
    app.add_middleware(
        SecurityHeadersMiddleware,
        production=settings.environment == "production",
    )
app.add_middleware(ObservabilityMiddleware, access_log_enabled=settings.access_log_enabled)
app.add_middleware(RequestContextMiddleware)


@app.get("/metrics", include_in_schema=False)
def prometheus_metrics(authorization: str | None = Header(default=None)) -> Response:
    current = get_settings()
    if not current.metrics_enabled:
        raise NotFoundError("Metrics are disabled.")
    if current.metrics_bearer_token:
        expected = f"Bearer {current.metrics_bearer_token}"
        if not authorization or not secrets.compare_digest(authorization, expected):
            raise UnauthorizedError("A metrics bearer token is required.")
    return Response(
        content=render_prometheus_metrics(),
        media_type=PROMETHEUS_CONTENT_TYPE,
        headers={"Cache-Control": "no-store"},
    )


if settings.environment == "production" and not settings.auth_required:
    log.warning(
        "ENVIRONMENT=production without AUTH_REQUIRED=true; production still "
        "enforces authentication, but set the flag explicitly for clarity."
    )

register_exception_handlers(app)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/api/docs",
        "openapi": "/api/openapi.json",
        "api": settings.api_v1_prefix,
    }


@app.get("/docs", include_in_schema=False)
def legacy_docs_redirect() -> RedirectResponse:
    return RedirectResponse("/api/docs", status_code=307)


@app.get("/openapi.json", include_in_schema=False)
def legacy_openapi_redirect() -> RedirectResponse:
    return RedirectResponse("/api/openapi.json", status_code=307)


app.include_router(api_router, prefix=settings.api_v1_prefix)
