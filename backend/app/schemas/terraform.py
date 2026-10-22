"""API schemas for Terraform plan review."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.ai import StructuredDiagnosis
from app.schemas.evidence import Evidence, Severity

TerraformAction = Literal["create", "update", "replace", "destroy", "read", "no-op", "unknown"]
BlastRadius = Literal["none", "low", "medium", "high", "critical"]


class TerraformReviewRequest(BaseModel):
    plan: dict[str, Any]


class TerraformChange(BaseModel):
    address: str
    type: str | None = None
    name: str | None = None
    provider: str | None = None
    module: str | None = None
    actions: list[str] = Field(default_factory=list)
    action: TerraformAction = "unknown"
    action_reason: str | None = None
    replace_paths: list[str] = Field(default_factory=list)
    changed_attributes: list[str] = Field(default_factory=list)
    unknown_attributes: list[str] = Field(default_factory=list)
    stateful: bool = False
    risk: Literal["low", "medium", "high", "critical"] = "low"
    risk_reasons: list[str] = Field(default_factory=list)


class TerraformFinding(BaseModel):
    severity: Severity
    title: str
    detail: str
    address: str | None = None
    action: TerraformAction = "unknown"
    evidence_id: str | None = None


class TerraformSummary(BaseModel):
    total: int = 0
    create: int = 0
    update: int = 0
    replace: int = 0
    destroy: int = 0
    read: int = 0
    no_op: int = 0
    unknown: int = 0
    blast_radius: BlastRadius = "none"
    headline: str


class TerraformReviewResponse(BaseModel):
    format_version: str | None = None
    terraform_version: str | None = None
    summary: TerraformSummary
    changes: list[TerraformChange] = Field(default_factory=list)
    findings: list[TerraformFinding] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    demo: bool = False


class TerraformExplainRequest(TerraformReviewRequest):
    question: str = Field(
        default=(
            "Explain the riskiest changes in this plan and what an operator "
            "should verify before applying it."
        ),
        min_length=1,
        max_length=2000,
    )


class TerraformExplainResponse(BaseModel):
    review: TerraformReviewResponse
    explanation: StructuredDiagnosis
