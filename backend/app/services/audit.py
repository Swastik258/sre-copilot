"""Audit event recording.

Audit events capture sensitive or security-relevant actions (approvals,
integration changes, credential use). Resource and outcome payloads are redacted
before persistence.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.redaction import redact_obj
from app.core.request_context import get_request_id
from app.db.models import AuditEvent


def record_event(
    db: Session,
    *,
    action: str,
    actor: str,
    decision: str,
    user_id: str | None = None,
    resource: dict[str, Any] | None = None,
    reason: str | None = None,
    outcome: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> AuditEvent:
    settings = get_settings()
    enabled = settings.redaction_enabled
    event = AuditEvent(
        user_id=user_id,
        action=action,
        actor=actor,
        resource=redact_obj(resource, enabled=enabled),
        decision=decision,
        reason=reason,
        outcome=redact_obj(outcome, enabled=enabled),
        request_id=request_id or get_request_id(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
