import logging
from pathlib import Path

from fastapi import APIRouter, Response
from sqlalchemy import text

from app.core.config import get_settings
from app.core.prom_metrics import DB_READY
from app.db.session import SessionLocal
from app.schemas.health import HealthResponse
from app.services.integrations import integration_statuses

router = APIRouter()
log = logging.getLogger(__name__)


BACKEND_DIR = Path(__file__).resolve().parents[3]


def _db_ok() -> bool:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        DB_READY.set(1)
        return True
    except Exception:
        DB_READY.set(0)
        log.exception("Database health check failed")
        return False


def _migration_status() -> str:
    settings = get_settings()
    if settings.environment != "production":
        return "skipped"
    try:
        from alembic.config import Config
        from alembic.script import ScriptDirectory

        config = Config(str(BACKEND_DIR / "alembic.ini"))
        config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
        head = ScriptDirectory.from_config(config).get_current_head()
        with SessionLocal() as db:
            current = db.execute(text("SELECT version_num FROM alembic_version")).scalar()
        if not current:
            return "missing"
        return "ok" if current == head else f"behind:{current}"
    except Exception:
        log.exception("Could not determine migration readiness")
        return "unknown"


def _enabled_integrations() -> list[str]:
    settings = get_settings()
    report = integration_statuses(settings)
    return [
        item.kind for item in report.integrations if item.state.value in {"connected", "enabled"}
    ]


def _health() -> HealthResponse:
    settings = get_settings()
    ok = _db_ok()
    migrations = _migration_status()
    checks = {
        "database": "ok" if ok else "unavailable",
        "migrations": migrations,
        "auth": "required"
        if settings.auth_required or settings.environment == "production"
        else "demo",
        "background_jobs": ("configured" if settings.effective_background_jobs else "disabled"),
        "metrics": "enabled" if settings.metrics_enabled else "disabled",
    }
    ready = ok and migrations in {"ok", "skipped"}
    return HealthResponse(
        status="ok" if ready else "degraded",
        database="ok" if ok else "unavailable",
        version=settings.app_version,
        environment=settings.environment,
        ai_provider=settings.ai_provider,
        demo_mode=settings.demo_mode,
        integrations_enabled=_enabled_integrations(),
        checks=checks,
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
        checks={"process": "ok"},
    )


@router.get("/health/ready", response_model=HealthResponse, tags=["health"])
def ready(response: Response) -> HealthResponse:
    result = _health()
    if result.status != "ok":
        response.status_code = 503
    return result
