"""Durable job lifecycle, retry, and maintenance handler tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from cryptography.fernet import Fernet
from sqlalchemy import delete

from app.core.config import get_settings
from app.db.models import AuditEvent, BackgroundJob, IdempotencyRecord, Organization
from app.security.encryption import secret_box
from app.services import job_handlers
from app.services.jobs import (
    BackgroundWorker,
    enqueue_job,
    process_due_jobs,
    recover_stale_jobs,
    register_handler,
)


@pytest.fixture(autouse=True)
def _clean_jobs(db_session):
    yield
    db_session.execute(delete(BackgroundJob))
    db_session.commit()


@pytest.fixture()
def encryption_key():
    settings = get_settings()
    previous = settings.credential_encryption_key
    settings.credential_encryption_key = Fernet.generate_key().decode()
    try:
        yield settings.credential_encryption_key
    finally:
        settings.credential_encryption_key = previous


def _signup(client, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "correct-horse", "display_name": "Ada"},
    )
    assert response.status_code == 201, response.text
    return response.json()["user"]


def test_missing_encryption_key_is_explicit() -> None:
    settings = get_settings()
    previous = settings.credential_encryption_key
    settings.credential_encryption_key = None
    try:
        with pytest.raises(Exception) as exc:
            secret_box(settings)
        assert getattr(exc.value, "code", "") == "not_configured"
    finally:
        settings.credential_encryption_key = previous


def test_jobs_are_deduplicated_and_retry_until_success(db_session, encryption_key) -> None:
    calls: list[dict] = []

    def flaky(_db, payload: dict) -> None:
        calls.append(payload)
        if len(calls) == 1:
            raise RuntimeError("temporary token=super-secret-value")

    register_handler("test.flaky", flaky)
    first = enqueue_job(
        db_session,
        kind="test.flaky",
        payload={"value": "ok"},
        dedupe_key="job-test-dedupe",
    )
    duplicate = enqueue_job(
        db_session,
        kind="test.flaky",
        payload={"value": "ignored"},
        dedupe_key="job-test-dedupe",
    )
    assert duplicate.id == first.id

    assert process_due_jobs() >= 1
    db_session.expire_all()
    job = db_session.get(BackgroundJob, first.id)
    assert job is not None
    assert job.status == "retry"
    assert job.attempts == 1
    assert "super-secret-value" not in (job.last_error or "")
    assert job.available_at.replace(tzinfo=UTC) > datetime.now(UTC)

    job.available_at = datetime.now(UTC) - timedelta(seconds=1)
    db_session.commit()
    assert process_due_jobs() >= 1
    db_session.expire_all()
    job = db_session.get(BackgroundJob, first.id)
    assert job is not None
    assert job.status == "succeeded"
    assert job.attempts == 2
    assert job.encrypted_payload == ""
    assert calls == [{"value": "ok"}, {"value": "ok"}]


def test_permanent_failure_and_missing_handler_are_recorded(db_session, encryption_key) -> None:
    def always_fails(_db, _payload: dict) -> None:
        raise ValueError("token=never-log-this")

    register_handler("test.always_fails", always_fails)
    job = enqueue_job(db_session, kind="test.always_fails", payload={"a": 1})
    job.max_attempts = 1
    db_session.commit()

    assert process_due_jobs() >= 1
    db_session.expire_all()
    stored = db_session.get(BackgroundJob, job.id)
    assert stored is not None
    assert stored.status == "failed"
    assert stored.completed_at is not None
    assert "never-log-this" not in (stored.last_error or "")

    unknown = enqueue_job(db_session, kind="test.no_such_kind", payload={})
    assert process_due_jobs() >= 1
    db_session.expire_all()
    stored_unknown = db_session.get(BackgroundJob, unknown.id)
    assert stored_unknown is not None
    assert stored_unknown.status == "retry"
    assert "No handler" in (stored_unknown.last_error or "")


def test_stale_running_jobs_are_recovered(db_session, encryption_key) -> None:
    job = enqueue_job(db_session, kind="test.stale", payload={})
    job.status = "running"
    job.attempts = 1
    job.updated_at = datetime.now(UTC) - timedelta(hours=1)
    db_session.commit()

    assert recover_stale_jobs(older_than_seconds=60) >= 1
    db_session.expire_all()
    stored = db_session.get(BackgroundJob, job.id)
    assert stored is not None
    assert stored.status == "retry"
    assert "Worker stopped" in (stored.last_error or "")


def test_email_handlers_validate_payloads_and_deliver(
    db_session, encryption_key, monkeypatch
) -> None:
    delivered: list[tuple[str, str]] = []
    monkeypatch.setattr(
        job_handlers,
        "send_verification_email",
        lambda _settings, *, to, token: delivered.append(("verify", f"{to}:{token}")),
    )
    monkeypatch.setattr(
        job_handlers,
        "send_password_reset_email",
        lambda _settings, *, to, token: delivered.append(("reset", f"{to}:{token}")),
    )
    job_handlers._verification(db_session, {"to": "a@example.com", "token": "v1"})
    job_handlers._reset(db_session, {"to": "a@example.com", "token": "r1"})
    assert delivered == [("verify", "a@example.com:v1"), ("reset", "a@example.com:r1")]

    with pytest.raises(ValueError, match="verification"):
        job_handlers._verification(db_session, {"to": None, "token": "x"})
    with pytest.raises(ValueError, match="reset"):
        job_handlers._reset(db_session, {"to": "a@example.com", "token": 1})
    with pytest.raises(ValueError, match="retention"):
        job_handlers._retention(db_session, {"tenant_id": ""})


def test_retention_and_idempotency_cleanup_handlers(db_session) -> None:
    tenant = "handler-tenant"
    old = AuditEvent(
        action="test.handler.old",
        actor="test",
        decision="allow",
        tenant_id=tenant,
        created_at=datetime.now(UTC) - timedelta(days=30),
    )
    new = AuditEvent(
        action="test.handler.new",
        actor="test",
        decision="allow",
        tenant_id=tenant,
        created_at=datetime.now(UTC),
    )
    expired = IdempotencyRecord(
        scope_hash="scope",
        idempotency_key="expired-key",
        request_hash="request",
        expires_at=datetime.now(UTC) - timedelta(hours=1),
    )
    live = IdempotencyRecord(
        scope_hash="scope",
        idempotency_key="live-key",
        request_hash="request",
        expires_at=datetime.now(UTC) + timedelta(hours=1),
    )
    db_session.add_all([old, new, expired, live])
    db_session.commit()
    old_id, new_id = old.id, new.id
    expired_id, live_id = expired.id, live.id

    job_handlers._retention(db_session, {"tenant_id": tenant, "days": 7})
    job_handlers._idempotency_cleanup(db_session, {})
    db_session.expire_all()
    assert db_session.get(AuditEvent, old_id) is None
    assert db_session.get(AuditEvent, new_id) is not None
    assert db_session.get(IdempotencyRecord, expired_id) is None
    assert db_session.get(IdempotencyRecord, live_id) is not None


def test_maintenance_scheduling_is_once_per_day(client, db_session, encryption_key) -> None:
    _signup(client, "jobs-maintenance@example.com")
    assert db_session.scalar(__import__("sqlalchemy").select(Organization).limit(1)) is not None
    first = job_handlers.schedule_maintenance_jobs(db_session)
    second = job_handlers.schedule_maintenance_jobs(db_session)
    assert first >= 1
    assert second == first
    idempotency_jobs = db_session.scalars(
        __import__("sqlalchemy")
        .select(BackgroundJob)
        .where(BackgroundJob.kind == "maintenance.idempotency")
    ).all()
    assert len(idempotency_jobs) == 1


def test_worker_starts_and_stops(encryption_key) -> None:
    settings = get_settings()
    previous = settings.background_job_poll_seconds
    settings.background_job_poll_seconds = 0.1
    worker = BackgroundWorker()
    try:
        worker.start()
        worker.start()  # idempotent
        worker.stop(timeout=2)
        assert worker._thread is None
    finally:
        settings.background_job_poll_seconds = previous
