"""Workspace, membership, and invite contracts for the isolation milestone."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

WorkspaceRole = Literal["owner", "admin", "member", "viewer"]

_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,78}$")


def _utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


class WorkspaceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=120)

    @field_validator("name")
    @classmethod
    def _clean_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Workspace name is too short.")
        return cleaned


class WorkspaceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=2, max_length=120)
    settings: dict[str, Any] | None = None

    @field_validator("name")
    @classmethod
    def _clean_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Workspace name is too short.")
        return cleaned


class WorkspaceOut(BaseModel):
    id: str
    slug: str
    name: str
    role: WorkspaceRole
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def _as_utc(cls, value: datetime) -> datetime:
        return _utc(value) or value


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceOut]
    total: int


class WorkspaceMemberOut(BaseModel):
    user_id: str
    email: str | None = None
    display_name: str | None = None
    role: WorkspaceRole
    created_at: datetime

    @field_validator("created_at")
    @classmethod
    def _as_utc(cls, value: datetime) -> datetime:
        return _utc(value) or value


class WorkspaceMembersResponse(BaseModel):
    members: list[WorkspaceMemberOut]
    total: int


class MemberRoleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: WorkspaceRole


class MemberAdd(BaseModel):
    """Directly add an existing account to a workspace (no invite)."""

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


class InviteCreate(BaseModel):
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


class InviteOut(BaseModel):
    id: str
    workspace_id: str
    email: str
    role: WorkspaceRole
    expires_at: datetime
    accepted_at: datetime | None = None
    created_at: datetime

    @field_validator("expires_at", "accepted_at", "created_at")
    @classmethod
    def _as_utc(cls, value: datetime | None) -> datetime | None:
        return _utc(value)


class InvitesResponse(BaseModel):
    invites: list[InviteOut]
    total: int


class InviteAcceptResponse(BaseModel):
    workspace: WorkspaceOut


class DeleteConfirmation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    confirm: str = Field(min_length=1, max_length=120)
