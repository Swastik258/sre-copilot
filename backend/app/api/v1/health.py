import logging

from fastapi import APIRouter
from sqlalchemy import text

from app.db.session import SessionLocal
from app.schemas.health import HealthResponse

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


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    ok = _db_ok()
    return HealthResponse(status="ok" if ok else "degraded", database="ok" if ok else "unavailable")


@router.get("/health/live", response_model=HealthResponse)
def live() -> HealthResponse:
    return HealthResponse(status="ok", database="skipped")


@router.get("/health/ready", response_model=HealthResponse)
def ready() -> HealthResponse:
    ok = _db_ok()
    return HealthResponse(status="ok" if ok else "degraded", database="ok" if ok else "unavailable")