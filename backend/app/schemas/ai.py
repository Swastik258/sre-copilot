"""Schemas for the AI provider boundary.

``StructuredDiagnosis`` extends the shared
:class:`~app.schemas.investigation.Diagnosis` contract rather than forking it.
The additional fields describe the evidence a provider was given, what it could
not determine, and remediation it proposes (never executes).

Part A is provider-only: nothing defined here is persisted, and no evidence ref
carries an ``evidence_id`` yet.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.evidence import Evidence
from app.schemas.investigation import Diagnosis


class EvidenceRef(Evidence):
    """A renderable view of evidence supplied to a provider.

    ``evidence_id`` is always ``None`` in Part A because nothing is persisted.
    ``kind`` is a Part B placeholder for the finding kind (for example
    ``crash_loop``); it is deliberately not populated now and is not a duplicate
    of ``source_type``.
    """

    evidence_id: str | None = None
    kind: str | None = None


class Hypothesis(BaseModel):
    """An interpretation that cites the evidence supporting it."""

    explanation: str = Field(min_length=1, max_length=2000)
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_ids: list[str] = Field(default_factory=list)


class ProposedAction(BaseModel):
    """A remediation proposal. It is never executed automatically."""

    description: str = Field(min_length=1, max_length=1000)
    changes_state: bool = False
    risk: Literal["low", "medium", "high"] = "low"
    requires_approval: bool = True


class AIRequest(BaseModel):
    """Body for ``POST /api/v1/ai/diagnose``."""

    question: str = Field(min_length=1, max_length=2000)
    surface: Literal["kubernetes", "logs", "cicd", "terraform", "unknown"] = "unknown"
    evidence: list[Evidence] = Field(default_factory=list)

    @field_validator("question", mode="before")
    @classmethod
    def _strip_question(cls, value: object) -> object:
        """Trim surrounding whitespace before length validation.

        A whitespace-only question therefore fails ``min_length`` with a 422
        instead of being accepted as a non-empty string.
        """

        return value.strip() if isinstance(value, str) else value


class StructuredDiagnosis(Diagnosis):
    """Provider output, extending the shared diagnosis contract.

    ``confidence`` is inherited from :class:`Diagnosis`; it is not redeclared.
    ``hypotheses`` and ``next_steps`` intentionally narrow the inherited types
    to the AI boundary's simpler shapes.
    """

    observed_evidence: list[EvidenceRef] = Field(default_factory=list)
    hypotheses: list[Hypothesis] = Field(default_factory=list)  # type: ignore[assignment]
    next_steps: list[str] = Field(default_factory=list)  # type: ignore[assignment]
    proposed_remediation: list[ProposedAction] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    unknowns: list[str] = Field(default_factory=list)
    demo: bool = False
