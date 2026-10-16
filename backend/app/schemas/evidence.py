"""The shared evidence model.

Evidence is the unit of truth across the product: Kubernetes status, GitHub
run failures, log snippets, metric queries, Terraform findings and user
statements all become :class:`Evidence` records. Diagnoses cite evidence by ID
rather than restating it, so a reviewer can always inspect what a conclusion was
based on.

Every record keeps provenance (where it came from), a collection timestamp, and
an integrity fingerprint over the *redacted* payload so tampering after the fact
is detectable.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class EvidenceSource(str, Enum):
    kubernetes = "kubernetes"
    github = "github"
    logs = "logs"
    terraform = "terraform"
    prometheus = "prometheus"
    user = "user"
    ai = "ai"
    system = "system"


class Severity(str, Enum):
    info = "info"
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Evidence(BaseModel):
    id: str
    investigation_id: str | None = None
    source_type: EvidenceSource
    source_resource: str | None = None
    environment: str | None = None
    # Timestamp of the underlying event (may be None if unknown).
    timestamp: datetime | None = None
    # When this copilot collected the evidence.
    collected_at: datetime
    severity: Severity = Severity.info
    summary: str
    # Redacted structured payload or text excerpt. Never raw credentials.
    payload: object | None = None
    provenance: str | None = None
    related_ids: list[str] = Field(default_factory=list)
    # sha256 over the redacted payload + key fields.
    integrity: str | None = None
    redacted: bool = True
    # True when the record originates from a fixture rather than a live system.
    demo: bool = False


class EvidenceCreate(BaseModel):
    source_type: EvidenceSource
    summary: str = Field(min_length=1, max_length=2000)
    source_resource: str | None = None
    environment: str | None = None
    timestamp: datetime | None = None
    severity: Severity = Severity.info
    payload: object | None = None
    provenance: str | None = None
    related_ids: list[str] = Field(default_factory=list)
    demo: bool = False
