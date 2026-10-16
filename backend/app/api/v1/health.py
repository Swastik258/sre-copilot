import logging

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.schemas.health import HealthResponse
from app.services.integrations import integration_statuses

router = APIRouter()
log = logging.getLogger(__name__)


def _db_ok() -> bool:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return True
    except Exception:
        log.exception("Database health check failed")
        return False


def _enabled_integrations() -> list[str]:
    settings = get_settings()
    report = integration_statuses(settings)
    return [
        item.kind
        for item in report.integrations
        if item.state.value in {"connected", "enabled"}
    ]


def _health() -> HealthResponse:
    settings = get_settings()
    ok = _db_ok()
    return HealthResponse(
        status="ok" if ok else "degraded",
        database="ok" if ok else "unavailable",
        version=settings.app_version,
        environment=settings.environment,
        ai_provider=settings.ai_provider,
        demo_mode=settings.demo_mode,
        integrations_enabled=_enabled_integrations(),
    )


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    return _health()


@router.get("/health/live", response_model=HealthResponse, tags=["health"])
def live() -> HealthResponse:
    # Liveness must not depend on downstream dependencies.
    settings = get_settings()
    return HealthResponse(
        status="ok",
        database="skipped",
        version=settings.app_version,
        environment=settings.environment,
        ai_provider=settings.ai_provider,
        demo_mode=settings.demo_mode,
    )


@router.get("/health/ready", response_model=HealthResponse, tags=["health"])
def ready() -> HealthResponse:
    return _health()
