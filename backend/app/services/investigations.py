"""Persisted investigations and assistant messages.

Investigations use the existing ``investigations`` table. Message history is
stored in the ``result`` JSON document so the first version does not require a
second conversation table; evidence remains in the shared ``evidence`` table.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import NotFoundError
from app.db.models import Evidence as EvidenceModel
from app.db.models import Investigation, User
from app.schemas.ai import AIRequest, StructuredDiagnosis
from app.schemas.evidence import Evidence, EvidenceSource
from app.schemas.investigation import (
    Diagnosis,
    Hypothesis,
    InvestigationCreate,
    InvestigationDetail,
    InvestigationKind,
    InvestigationListResponse,
    InvestigationMessagesResponse,
    InvestigationStatus,
    InvestigationSummary,
    MessageExchange,
    MessageOut,
    MessageRole,
    RecommendedStep,
    Remediation,
    RiskLevel,
)
from app.services.ai import summarize
from app.services.audit import record_event
from app.services.settings_store import get_ai_privacy_override


def _now() -> datetime:
    return datetime.now(UTC)


def _messages(investigation: Investigation) -> list[dict]:
    result = investigation.result if isinstance(investigation.result, dict) else {}
    messages = result.get("messages", [])
    return messages if isinstance(messages, list) else []


def _evidence_ids(db: Session, investigation_id: str) -> list[str]:
    return list(
        db.scalars(
            select(EvidenceModel.id)
            .where(EvidenceModel.investigation_id == investigation_id)
            .order_by(EvidenceModel.collected_at)
        )
    )


def _to_summary(db: Session, investigation: Investigation) -> InvestigationSummary:
    return InvestigationSummary(
        id=investigation.id,
        title=investigation.title,
        kind=InvestigationKind(investigation.kind),
        status=InvestigationStatus(investigation.status),
        summary=investigation.summary,
        demo=False,
        created_at=investigation.created_at,
        updated_at=investigation.updated_at,
    )


def _to_detail(db: Session, investigation: Investigation) -> InvestigationDetail:
    base = _to_summary(db, investigation)
    return InvestigationDetail(
        **base.model_dump(),
        evidence_ids=_evidence_ids(db, investigation.id),
        message_count=len(_messages(investigation)),
    )


def _message_out(message: dict) -> MessageOut:
    diagnosis = message.get("diagnosis")
    return MessageOut(
        id=message["id"],
        role=MessageRole(message["role"]),
        content=message["content"],
        diagnosis=Diagnosis.model_validate(diagnosis) if diagnosis else None,
        created_at=message["created_at"],
    )


def _tenant_filters(user: User) -> list:
    """Owners/admins can inspect every investigation in their workspace.

    Members and viewers see only their own records, always bounded by the
    active tenant. Cross-tenant access is never granted by role.
    """

    if user.role in {"owner", "admin"}:
        return [Investigation.tenant_id == user.tenant_id]
    return [
        Investigation.user_id == user.id,
        Investigation.tenant_id == user.tenant_id,
    ]


def get_investigation(db: Session, user: User, investigation_id: str) -> Investigation:
    investigation = db.scalar(
        select(Investigation).where(
            Investigation.id == investigation_id,
            *_tenant_filters(user),
        )
    )
    if investigation is None:
        raise NotFoundError("Investigation not found")
    return investigation


def create_investigation(
    db: Session, user: User, payload: InvestigationCreate
) -> InvestigationDetail:
    investigation = Investigation(
        user_id=user.id,
        tenant_id=user.tenant_id,
        title=payload.title.strip(),
        kind=payload.kind.value,
        status=InvestigationStatus.open.value,
        result={
            "messages": [],
            "environment": payload.environment,
            "target": payload.target,
        },
        evidence=[],
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    record_event(
        db,
        action="investigation.create",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"investigation_id": investigation.id, "kind": investigation.kind},
    )
    return _to_detail(db, investigation)


def list_investigations(
    db: Session,
    user: User,
    *,
    status: InvestigationStatus | None = None,
    kind: InvestigationKind | None = None,
    limit: int = 50,
    offset: int = 0,
) -> InvestigationListResponse:
    filters = [*_tenant_filters(user)]
    if status is not None:
        filters.append(Investigation.status == status.value)
    if kind is not None:
        filters.append(Investigation.kind == kind.value)

    total = db.scalar(select(func.count()).select_from(Investigation).where(*filters)) or 0
    rows = list(
        db.scalars(
            select(Investigation)
            .where(*filters)
            .order_by(Investigation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    return InvestigationListResponse(
        investigations=[_to_detail(db, investigation) for investigation in rows],
        total=total,
    )


def get_messages(
    db: Session, user: User, investigation_id: str
) -> InvestigationMessagesResponse:
    investigation = get_investigation(db, user, investigation_id)
    return InvestigationMessagesResponse(
        investigation_id=investigation.id,
        messages=[_message_out(message) for message in _messages(investigation)],
    )


def _db_evidence(db: Session, investigation_id: str) -> list[Evidence]:
    rows = list(
        db.scalars(
            select(EvidenceModel)
            .where(EvidenceModel.investigation_id == investigation_id)
            .order_by(EvidenceModel.collected_at)
            .limit(50)
        )
    )
    return [
        Evidence(
            id=row.id,
            investigation_id=row.investigation_id,
            source_type=EvidenceSource(row.source_type),
            source_resource=row.source_resource,
            environment=row.environment,
            timestamp=row.event_timestamp,
            collected_at=row.collected_at,
            severity=row.severity,
            summary=row.summary,
            payload=row.payload,
            provenance=row.provenance,
            related_ids=row.related_ids or [],
            integrity=row.integrity,
            redacted=row.redacted,
            demo=row.demo,
        )
        for row in rows
    ]


def _as_diagnosis(ai: StructuredDiagnosis) -> Diagnosis:
    return Diagnosis(
        summary=ai.summary,
        impact=ai.impact,
        confirmed_observations=list(ai.confirmed_observations),
        hypotheses=[
            Hypothesis(
                statement=hypothesis.explanation,
                confidence=hypothesis.confidence,
                evidence_ids=hypothesis.evidence_ids,
            )
            for hypothesis in ai.hypotheses
        ],
        evidence_ids=list(ai.evidence_ids),
        confidence=ai.confidence,
        confidence_basis=ai.confidence_basis,
        missing_evidence=list(ai.unknowns),
        next_steps=[
            RecommendedStep(action=step, changes_state=False, risk=RiskLevel.none)
            for step in ai.next_steps
        ],
        remediation=[
            Remediation(
                title=action.description,
                description=action.description,
                changes_state=action.changes_state,
                risk=RiskLevel(action.risk),
                requires_approval=action.requires_approval,
            )
            for action in ai.proposed_remediation
        ],
        risk_level=RiskLevel(ai.risk_level.value),
        model_generated=ai.model_generated,
        model_provider=ai.model_provider,
        model_name=ai.model_name,
    )


def add_message(db: Session, user: User, investigation_id: str, content: str) -> MessageExchange:
    investigation = get_investigation(db, user, investigation_id)
    evidence = _db_evidence(db, investigation.id)
    surface = investigation.kind if investigation.kind in {
        "kubernetes",
        "logs",
        "cicd",
        "terraform",
        "unknown",
    } else "unknown"
    ai = summarize(
        AIRequest(question=content, surface=surface, evidence=evidence),  # type: ignore[arg-type]
        privacy_mode=get_ai_privacy_override(db, user.tenant_id),
    )
    diagnosis = _as_diagnosis(ai)

    result = investigation.result if isinstance(investigation.result, dict) else {}
    messages = _messages(investigation)
    now = _now()
    user_message = {
        "id": str(uuid.uuid4()),
        "role": MessageRole.user.value,
        "content": content,
        "diagnosis": None,
        "created_at": now.isoformat(),
    }
    assistant_message = {
        "id": str(uuid.uuid4()),
        "role": MessageRole.assistant.value,
        "content": diagnosis.summary,
        "diagnosis": diagnosis.model_dump(mode="json"),
        "created_at": _now().isoformat(),
    }
    messages.extend([user_message, assistant_message])
    investigation.result = {
        **result,
        "messages": messages,
        "last_diagnosis": diagnosis.model_dump(mode="json"),
    }
    if not investigation.summary:
        investigation.summary = diagnosis.summary
    if investigation.title.strip().lower() in {"new investigation", "untitled"}:
        investigation.title = content.strip()[:80] or investigation.title
    investigation.status = InvestigationStatus.in_progress.value
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    record_event(
        db,
        action="investigation.message",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"investigation_id": investigation.id},
        outcome={"assistant_model": ai.model_provider, "evidence_count": len(evidence)},
    )
    return MessageExchange(
        user_message=_message_out(user_message),
        assistant_message=_message_out(assistant_message),
        diagnosis=diagnosis,
    )


def close_investigation(db: Session, user: User, investigation_id: str) -> InvestigationDetail:
    investigation = get_investigation(db, user, investigation_id)
    investigation.status = InvestigationStatus.closed.value
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    return _to_detail(db, investigation)
