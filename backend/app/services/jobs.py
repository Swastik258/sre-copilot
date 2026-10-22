"""Durable background jobs with retries and graceful shutdown.

Jobs are intentionally small and database-backed rather than tied to an
in-process task. Payloads are encrypted before persistence because email jobs
contain single-use tokens. The worker is opt-in; enable it in production with
``BACKGROUND_JOBS_ENABLED=true`` and a ``CREDENTIAL_ENCRYPTION_KEY``.
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.redaction import redact_text
from app.db.models import BackgroundJob
from app.db.session import SessionLocal
from app.security.encryption import secret_box

log = logging.getLogger("app.jobs")

Handler = Callable[[Session, dict[str, Any]], None]
_HANDLERS: dict[str, Handler] = {}


def register_handler(kind: str, handler: Handler) -> None:
    _HANDLERS[kind] = handler


def _now() -> datetime:
    return datetime.now(UTC)


def enqueue_job(
    db: Session,
    *,
    kind: str,
    payload: dict[str, Any],
    dedupe_key: str | None = None,
    available_at: datetime | None = None,
) -> BackgroundJob:
    settings = get_settings()
    box = secret_box(settings)
    if dedupe_key:
        existing = db.scalar(
            select(BackgroundJob).where(BackgroundJob.dedupe_key == dedupe_key)
        )
        if existing is not None:
            return existing
    job = BackgroundJob(
        kind=kind,
        dedupe_key=dedupe_key,
        encrypted_payload=box.encrypt_json(payload),
        status="pending",
        attempts=0,
        max_attempts=max(1, settings.background_job_max_attempts),
        available_at=available_at or _now(),
    )
    db.add(job)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if not dedupe_key:
            raise
        existing = db.scalar(
            select(BackgroundJob).where(BackgroundJob.dedupe_key == dedupe_key)
        )
        if existing is None:
            raise
        return existing
    db.refresh(job)
    return job


def recover_stale_jobs(older_than_seconds: int = 600) -> int:
    """Return abandoned running jobs to the retry queue after a hard crash."""

    cutoff = _now() - timedelta(seconds=max(60, older_than_seconds))
    db = SessionLocal()
    try:
        result = db.execute(
            update(BackgroundJob)
            .where(
                BackgroundJob.status == "running",
                BackgroundJob.updated_at < cutoff,
            )
            .values(
                status="retry",
                available_at=_now(),
                last_error="Worker stopped before the job completed.",
            )
        )
        db.commit()
        return int(result.rowcount or 0)
    finally:
        db.close()


def process_due_jobs(limit: int = 10) -> int:
    """Process due jobs. Returns the number attempted."""

    # Import registers the built-in handlers.
    from app.services import job_handlers  # noqa: F401

    settings = get_settings()
    box = secret_box(settings)
    db = SessionLocal()
    processed = 0
    try:
        rows = list(
            db.scalars(
                select(BackgroundJob)
                .where(
                    BackgroundJob.status.in_(("pending", "retry")),
                    BackgroundJob.available_at <= _now(),
                )
                .order_by(BackgroundJob.available_at)
                .limit(max(1, min(limit, 100)))
            )
        )
        for job in rows:
            processed += 1
            job.status = "running"
            job.attempts += 1
            db.commit()
            handler = _HANDLERS.get(job.kind)
            if handler is None:
                _fail(db, job, "No handler is registered for this job kind.")
                continue
            try:
                payload = box.decrypt_json(job.encrypted_payload)
                handler(db, payload)
            except Exception as exc:  # noqa: BLE001 - retried, never leaks payload
                _fail(db, job, f"{type(exc).__name__}: {exc}")
            else:
                job.status = "succeeded"
                job.last_error = None
                job.completed_at = _now()
                job.encrypted_payload = ""
                db.commit()
    finally:
        db.close()
    return processed


def _fail(db: Session, job: BackgroundJob, message: str) -> None:
    safe = redact_text(message, enabled=True)[:500]
    job.last_error = safe
    if job.attempts >= job.max_attempts:
        job.status = "failed"
        job.completed_at = _now()
        log.error("Background job %s (%s) failed permanently", job.id, job.kind)
    else:
        job.status = "retry"
        delay = min(3600, 5 * (2 ** max(0, job.attempts - 1)))
        job.available_at = _now() + timedelta(seconds=delay)
        log.warning(
            "Background job %s (%s) failed; retry %s/%s in %ss",
            job.id,
            job.kind,
            job.attempts,
            job.max_attempts,
            delay,
        )
    db.commit()


class BackgroundWorker:
    def __init__(self) -> None:
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        try:
            recovered = recover_stale_jobs()
            if recovered:
                log.warning("Recovered %s stale background job(s)", recovered)
        except Exception:  # noqa: BLE001 - startup proceeds; poll continues
            log.exception("Could not recover stale background jobs")
        self._thread = threading.Thread(
            target=self._run, name="sre-background-worker", daemon=True
        )
        self._thread.start()
        log.info("Background worker started")

    def _run(self) -> None:
        poll = max(0.1, get_settings().background_job_poll_seconds)
        while not self._stop.wait(poll):
            try:
                process_due_jobs()
            except Exception:  # noqa: BLE001 - keep the worker alive
                log.exception("Background worker poll failed")

    def stop(self, timeout: float = 10.0) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=timeout)
            if self._thread.is_alive():
                log.error("Background worker did not stop within %ss", timeout)
            else:
                log.info("Background worker stopped")
        self._thread = None
