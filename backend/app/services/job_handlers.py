"""Built-in durable job handlers and maintenance scheduling."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import IdempotencyRecord, Organization
from app.services import audit as audit_service
from app.services import settings_store
from app.services.email import send_password_reset_email, send_verification_email
from app.services.jobs import enqueue_job, register_handler


def _verification(db: Session, payload: dict[str, Any]) -> None:
    to = payload.get("to")
    token = payload.get("token")
    if not isinstance(to, str) or not isinstance(token, str):
        raise ValueError("Invalid verification email payload.")
    send_verification_email(get_settings(), to=to, token=token)


def _reset(db: Session, payload: dict[str, Any]) -> None:
    to = payload.get("to")
    token = payload.get("token")
    if not isinstance(to, str) or not isinstance(token, str):
        raise ValueError("Invalid password reset email payload.")
    send_password_reset_email(get_settings(), to=to, token=token)


def _retention(db: Session, payload: dict[str, Any]) -> None:
    tenant_id = payload.get("tenant_id")
    if not isinstance(tenant_id, str) or not tenant_id:
        raise ValueError("Invalid retention payload.")
    days = payload.get("days")
    if not isinstance(days, int) or isinstance(days, bool):
        days = settings_store.get_audit_retention_days(db, tenant_id)
    audit_service.apply_retention(db, days, tenant_id=tenant_id)


def _idempotency_cleanup(db: Session, _: dict[str, Any]) -> None:
    db.execute(
        delete(IdempotencyRecord)
        .where(IdempotencyRecord.expires_at < datetime.now(UTC))
        .execution_options(synchronize_session=False)
    )
    db.commit()


register_handler("email.verification", _verification)
register_handler("email.password_reset", _reset)
register_handler("audit.retention", _retention)
register_handler("maintenance.idempotency", _idempotency_cleanup)


def enqueue_verification_email(db: Session, *, to: str, token: str) -> None:
    enqueue_job(
        db,
        kind="email.verification",
        payload={"to": to, "token": token},
    )


def enqueue_password_reset_email(db: Session, *, to: str, token: str) -> None:
    enqueue_job(
        db,
        kind="email.password_reset",
        payload={"to": to, "token": token},
    )


def schedule_maintenance_jobs(db: Session) -> int:
    """Idempotently enqueue once-per-day retention jobs for every workspace."""

    day = datetime.now(UTC).date().isoformat()
    created = 0
    for organization in db.scalars(select(Organization)).all():
        organization_id = organization.id
        days = settings_store.get_audit_retention_days(db, organization_id)
        enqueue_job(
            db,
            kind="audit.retention",
            payload={"tenant_id": organization_id, "days": days},
            dedupe_key=f"audit-retention:{organization_id}:{day}",
        )
        created += 1
    enqueue_job(
        db,
        kind="maintenance.idempotency",
        payload={},
        dedupe_key=f"idempotency-cleanup:{day}",
    )
    return created
