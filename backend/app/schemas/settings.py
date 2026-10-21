"""Application settings contracts (non-secret values only)."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.integrations import IntegrationInfo


class SettingsResponse(BaseModel):
    ai_provider: str
    ai_model: str
    ai_privacy_mode: bool
    ai_privacy_source: str
    audit_retention_days: int
    default_environment: str | None = None
    auth_required: bool
    rate_limit_per_minute: int
    redaction_enabled: bool
    demo_mode: bool
    integrations: list[IntegrationInfo]


class SettingsUpdate(BaseModel):
    audit_retention_days: int | None = Field(default=None, ge=1, le=3650)
    ai_privacy_mode: bool | None = None
    default_environment: str | None = Field(default=None, max_length=120)
