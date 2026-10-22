"""Administration contracts for users and tenants."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.auth import UserOut

_TENANT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,35}$")


class AdminUserListResponse(BaseModel):
    users: list[UserOut]
    total: int


class AdminUserUpdate(BaseModel):
    role: Literal["owner", "admin", "member", "viewer"] | None = None
    tenant_id: str | None = Field(default=None, min_length=1, max_length=36)
    is_active: bool | None = None

    @field_validator("tenant_id")
    @classmethod
    def _valid_tenant(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not _TENANT_RE.fullmatch(cleaned):
            raise ValueError(
                "tenant_id must start with a letter or digit and contain only "
                "letters, digits, dots, underscores, or hyphens"
            )
        return cleaned


class TenantSummary(BaseModel):
    tenant_id: str
    name: str | None = None
    user_count: int


class TenantListResponse(BaseModel):
    tenants: list[TenantSummary]
    total: int
