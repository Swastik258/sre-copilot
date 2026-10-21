"""FastAPI application entrypoint.

Wires configuration, structured logging, correlation IDs, request limits,
consistent error handling and the versioned API router.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.ratelimit import MaxBodySizeMiddleware, RateLimitMiddleware
from app.core.request_context import RequestContextMiddleware
from app.core.security import SecurityHeadersMiddleware

configure_logging()

settings = get_settings()
log = logging.getLogger("app")


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


def _ensure_bootstrap_admin() -> None:
    """Promote ``BOOTSTRAP_ADMIN_EMAIL`` if the account already exists."""

    from app.db.session import SessionLocal
    from app.services.auth import ensure_bootstrap_admin

    with SessionLocal() as db:
        promoted = ensure_bootstrap_admin(db)
    if promoted is not None:
        log.info("Promoted %s to administrator via bootstrap configuration", promoted.email)


@asynccontextmanager
async def lifespan(_: FastAPI):
    _ensure_local_schema()
    _ensure_bootstrap_admin()
    yield


app = FastAPI(
    title="SRE Copilot API",
    version=settings.app_version,
    lifespan=lifespan,
    description=(
        "Evidence-backed, read-only infrastructure diagnosis. "
        "See /docs for interactive schema documentation."
    ),
)

# Order matters: the last middleware added is the outermost.
app.add_middleware(MaxBodySizeMiddleware, max_bytes=settings.max_request_bytes)
app.add_middleware(
    RateLimitMiddleware, limit_per_minute=settings.effective_rate_limit
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.allow_credentials,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)
if settings.security_headers_enabled:
    app.add_middleware(
        SecurityHeadersMiddleware,
        production=settings.environment == "production",
    )
app.add_middleware(RequestContextMiddleware)

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
        "docs": "/docs",
        "api": settings.api_v1_prefix,
    }


app.include_router(api_router, prefix=settings.api_v1_prefix)
