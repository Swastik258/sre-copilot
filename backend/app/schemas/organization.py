"""Organization/workspace and membership contracts."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

WorkspaceRole = Literal["owner", "admin", "member", "viewer"]

_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,78}$")


def _utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


class OrganizationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=120)

    @field_validator("name")
    @classmethod
    def _clean_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Workspace name is too short.")
        return cleaned


class OrganizationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=2, max_length=120)

    @field_validator("name")
    @classmethod
    def _clean_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Workspace name is too short.")
        return cleaned


class OrganizationOut(BaseModel):
    id: str
    name: str
    slug: str | None = None
    plan_id: str = "free"
    role: WorkspaceRole
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def _as_utc(cls, value: datetime) -> datetime:
        return _utc(value) or value


class OrganizationListResponse(BaseModel):
    organizations: list[OrganizationOut]
    total: int
    active_id: str


class OrgMemberOut(BaseModel):
    user_id: str
    email: str | None = None
    display_name: str | None = None
    role: WorkspaceRole
    is_active: bool = True
    created_at: datetime


class OrgMembersResponse(BaseModel):
    members: list[OrgMemberOut]
    total: int


class MemberAdd(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=320)
    role: WorkspaceRole = "member"

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", cleaned):
            raise ValueError("Enter a valid email address.")
        return cleaned


class MemberUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: WorkspaceRole


class OrganizationSwitchResponse(BaseModel):
    organization: OrganizationOut
