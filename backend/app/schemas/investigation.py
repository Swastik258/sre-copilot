"""Investigation and diagnosis schemas.

The diagnosis schema is intentionally explicit about the separation the product
promises: confirmed observations (facts with evidence) are distinct from
hypotheses (interpretations the model or rules produced), and every hypothesis
points at the evidence that supports or contradicts it.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class InvestigationKind(str, Enum):
    kubernetes = "kubernetes"
    github = "github"
    logs = "logs"
    terraform = "terraform"
    metrics = "metrics"
    general = "general"


class InvestigationStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class RiskLevel(str, Enum):
    none = "none"
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Hypothesis(BaseModel):
    statement: str = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_ids: list[str] = Field(default_factory=list)
    reasoning: str | None = None
    contradicting_evidence_ids: list[str] = Field(default_factory=list)
    alternative: bool = False


class RecommendedStep(BaseModel):
    action: str
    purpose: str | None = None
    expected_output: str | None = None
    changes_state: bool = False
    risk: RiskLevel = RiskLevel.none


class Remediation(BaseModel):
    title: str
    description: str
    changes_state: bool = True
    risk: RiskLevel = RiskLevel.medium
    preconditions: list[str] = Field(default_factory=list)
    rollback: str | None = None
    verification: str | None = None
    # Remediation is never auto-executed; it requires explicit human approval.
    requires_approval: bool = True


class Diagnosis(BaseModel):
    """A structured, evidence-backed diagnosis.

    ``model_generated`` is True when any part of the conclusion came from an LLM
    rather than deterministic rules; the UI must label it accordingly.
    """

    summary: str
    impact: str | None = None
    confirmed_observations: list[str] = Field(default_factory=list)
    hypotheses: list[Hypothesis] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence_basis: str | None = None
    missing_evidence: list[str] = Field(default_factory=list)
    next_steps: list[RecommendedStep] = Field(default_factory=list)
    remediation: list[Remediation] = Field(default_factory=list)
    risk_level: RiskLevel = RiskLevel.none
    model_generated: bool = False
    model_provider: str | None = None
    model_name: str | None = None


class InvestigationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    kind: InvestigationKind = InvestigationKind.general
    environment: str | None = Field(default=None, max_length=120)
    target: str | None = Field(default=None, max_length=300)


class InvestigationSummary(BaseModel):
    id: str
    title: str
    kind: InvestigationKind
    status: InvestigationStatus
    summary: str | None = None
    demo: bool = False
    created_at: datetime
    updated_at: datetime


class InvestigationDetail(InvestigationSummary):
    evidence_ids: list[str] = Field(default_factory=list)
    message_count: int = 0


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class MessageOut(BaseModel):
    id: str
    role: MessageRole
    content: str
    diagnosis: Diagnosis | None = None
    created_at: datetime


class MessageExchange(BaseModel):
    """Returned when a user message produces an assistant diagnosis."""

    user_message: MessageOut
    assistant_message: MessageOut
    diagnosis: Diagnosis | None = None


class InvestigationListResponse(BaseModel):
    investigations: list[InvestigationDetail]
    total: int


class InvestigationMessagesResponse(BaseModel):
    investigation_id: str
    messages: list[MessageOut]
