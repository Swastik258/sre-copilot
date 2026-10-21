"""Unit tests for the AI provider boundary schemas.

These tests cover the request contract and the ``StructuredDiagnosis`` view
model only. Provider, service and endpoint behaviour is tested in later files.
"""

from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from app.schemas.ai import AIRequest, EvidenceRef, StructuredDiagnosis
from app.schemas.evidence import Evidence, EvidenceSource


def _evidence(**overrides: object) -> Evidence:
    values: dict[str, object] = {
        "id": "ev-1",
        "source_type": EvidenceSource.kubernetes,
        "collected_at": datetime.now(UTC),
        "summary": "Pod demo/api-0 is in CrashLoopBackOff.",
    }
    values.update(overrides)
    return Evidence(**values)


def test_ai_request_applies_defaults() -> None:
    request = AIRequest(question="why is my pod crashing?")

    assert request.question == "why is my pod crashing?"
    assert request.surface == "unknown"
    assert request.evidence == []


def test_ai_request_strips_surrounding_whitespace() -> None:
    request = AIRequest(question="  why is my pod crashing?  ")

    assert request.question == "why is my pod crashing?"


def test_ai_request_rejects_blank_question() -> None:
    with pytest.raises(ValidationError):
        AIRequest(question=" \t\n ")


def test_ai_request_rejects_question_over_max_length() -> None:
    with pytest.raises(ValidationError):
        AIRequest(question="x" * 2001)


def test_ai_request_rejects_unknown_surface() -> None:
    with pytest.raises(ValidationError):
        AIRequest(question="why?", surface="database")


def test_ai_request_accepts_existing_evidence_schema() -> None:
    request = AIRequest(
        question="why?",
        surface="kubernetes",
        evidence=[_evidence(demo=True)],
    )

    assert request.surface == "kubernetes"
    assert request.evidence[0].id == "ev-1"
    assert request.evidence[0].demo is True


def test_structured_diagnosis_defaults() -> None:
    diagnosis = StructuredDiagnosis(summary="No inference performed.")

    assert diagnosis.demo is False
    assert diagnosis.observed_evidence == []
    assert diagnosis.hypotheses == []
    assert diagnosis.next_steps == []
    assert diagnosis.proposed_remediation == []
    assert diagnosis.risks == []
    assert diagnosis.unknowns == []
    assert diagnosis.confidence == 0.0
    assert diagnosis.model_generated is False
    assert diagnosis.model_provider is None
    assert diagnosis.model_name is None


def test_structured_diagnosis_inherits_confidence_constraints() -> None:
    assert StructuredDiagnosis(summary="x", confidence=0.0).confidence == 0.0
    assert StructuredDiagnosis(summary="x", confidence=1.0).confidence == 1.0

    for invalid in (-0.5, 1.5):
        with pytest.raises(ValidationError):
            StructuredDiagnosis(summary="x", confidence=invalid)


def test_evidence_ref_keeps_part_a_placeholders_null() -> None:
    ref = EvidenceRef(
        id="ev-1",
        source_type=EvidenceSource.kubernetes,
        collected_at=datetime.now(UTC),
        summary="Pod demo/api-0 is in CrashLoopBackOff.",
    )

    assert ref.evidence_id is None
    assert ref.kind is None


def test_shared_evidence_schema_was_not_extended() -> None:
    # Part A adds these fields on the view model only; the shared contract
    # stays untouched so other integrations keep the same evidence shape.
    assert "evidence_id" not in Evidence.model_fields
    assert "kind" not in Evidence.model_fields
