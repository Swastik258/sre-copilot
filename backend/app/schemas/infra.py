"""Infrastructure-code generation contracts.

Generation is deterministic and read-only: the service returns proposed files
and policy notes. It never writes to a repository or cluster.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.evidence import Evidence, Severity

InfraKind = Literal["kubernetes_deployment", "kubernetes_service", "terraform_module"]


class InfraGenerateRequest(BaseModel):
    kind: InfraKind = "kubernetes_deployment"
    name: str = Field(min_length=1, max_length=63)
    namespace: str = Field(default="default", min_length=1, max_length=63)
    image: str = Field(default="ghcr.io/example/app:1.0.0", min_length=1, max_length=300)
    replicas: int = Field(default=2, ge=1, le=50)
    port: int = Field(default=8080, ge=1, le=65535)
    environment: str = Field(default="production", max_length=80)
    cpu_request: str = Field(default="100m", max_length=32)
    memory_request: str = Field(default="128Mi", max_length=32)
    cpu_limit: str = Field(default="500m", max_length=32)
    memory_limit: str = Field(default="512Mi", max_length=32)
    intent: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "namespace")
    @classmethod
    def _dns_label(cls, value: str) -> str:
        cleaned = value.strip().lower()
        allowed = set("abcdefghijklmnopqrstuvwxyz0123456789-")
        if not cleaned or cleaned[0] == "-" or cleaned[-1] == "-":
            raise ValueError("must be a DNS label")
        if any(char not in allowed for char in cleaned):
            raise ValueError("must contain only lowercase letters, digits, and hyphens")
        return cleaned

    @field_validator("image")
    @classmethod
    def _safe_image(cls, value: str) -> str:
        cleaned = value.strip()
        allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._/:@-")
        if any(char not in allowed for char in cleaned):
            raise ValueError("image contains unsupported characters")
        return cleaned


class GeneratedFile(BaseModel):
    path: str
    language: str
    content: str


class InfraPolicyFinding(BaseModel):
    severity: Severity
    rule: str
    message: str
    path: str | None = None


class InfraGenerateResponse(BaseModel):
    kind: InfraKind
    files: list[GeneratedFile] = Field(default_factory=list)
    findings: list[InfraPolicyFinding] = Field(default_factory=list)
    summary: str
    evidence: list[Evidence] = Field(default_factory=list)
    demo: bool = False
