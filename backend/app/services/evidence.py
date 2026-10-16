"""Evidence construction helpers.

Central place that turns raw findings into :class:`Evidence` records: it applies
redaction, stamps collection time, and computes an integrity fingerprint over the
redacted payload.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import UTC, datetime
from typing import Any

from app.core.config import get_settings
from app.core.redaction import redact_obj, redact_text
from app.schemas.evidence import Evidence, EvidenceSource, Severity


def _now() -> datetime:
    return datetime.now(UTC)


def fingerprint(payload: Any) -> str:
    data = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def build_evidence(
    *,
    source_type: EvidenceSource,
    summary: str,
    payload: Any = None,
    source_resource: str | None = None,
    environment: str | None = None,
    timestamp: datetime | None = None,
    severity: Severity = Severity.info,
    provenance: str | None = None,
    related_ids: list[str] | None = None,
    investigation_id: str | None = None,
    demo: bool = False,
    redaction_enabled: bool | None = None,
) -> Evidence:
    settings = get_settings()
    if redaction_enabled is None:
        redaction_enabled = settings.redaction_enabled

    redacted_payload = redact_obj(payload, enabled=redaction_enabled)
    redacted_summary = redact_text(summary, enabled=redaction_enabled)

    return Evidence(
        id=str(uuid.uuid4()),
        investigation_id=investigation_id,
        source_type=source_type,
        source_resource=source_resource,
        environment=environment,
        timestamp=timestamp,
        collected_at=_now(),
        severity=severity,
        summary=redacted_summary,
        payload=redacted_payload,
        provenance=provenance,
        related_ids=related_ids or [],
        integrity=fingerprint(
            {
                "source_type": source_type.value,
                "source_resource": source_resource,
                "summary": redacted_summary,
                "payload": redacted_payload,
            }
        ),
        redacted=redaction_enabled,
        demo=demo,
    )
