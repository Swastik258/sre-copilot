"""Authenticated customer profile, preferences, integration flags, and API keys."""

from __future__ import annotations

import re
from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession, RequiredUser
from app.core.config import get_settings
from app.core.errors import ConflictError, NotFoundError, UnauthorizedError, ValidationError
from app.db.models import (
    AccountSettings,
    Organization,
    OrganizationMembership,
    User,
    UserApiKey,
)
from app.security.password_policy import (
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
    validate_password_strength,
)
from app.security.passwords import verify_password
from app.security.tokens import generate_token, hash_token
from app.services import auth as auth_service
from app.services.audit import record_event
from app.services.email import send_verification_email

router = APIRouter(prefix="/account", tags=["account"])


class AccountProfile(BaseModel):
    display_name: str | None
    email: str | None


class AccountKeySummary(BaseModel):
    id: str
    name: str
    prefix: str
    created_at: datetime


class AccountResponse(BaseModel):
    profile: AccountProfile
    preferences: dict[str, str | bool]
    integrations: dict[str, bool]
    api_keys: list[AccountKeySummary]
    plan: str = "free"
    role: str = "member"


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    display_name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, min_length=3, max_length=320)
    current_password: str | None = Field(default=None, min_length=1, max_length=128)

    @field_validator("display_name")
    @classmethod
    def clean_name(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", cleaned):
            raise ValueError("Enter a valid email address.")
        return cleaned


class PasswordUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)
    new_password: str = Field(min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)

    @field_validator("new_password")
    @classmethod
    def _strong_password(cls, value: str) -> str:
        return validate_password_strength(value)


class PreferencesUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    theme: str | None = None
    notifications: bool | None = None

    @field_validator("theme")
    @classmethod
    def valid_theme(cls, value: str | None) -> str | None:
        if value not in {"dark", "system"}:
            raise ValueError("Theme must be dark or system.")
        return value

    @field_validator("notifications")
    @classmethod
    def valid_notifications(cls, value: bool | None) -> bool:
        if value is None:
            raise ValueError("Notifications must be true or false.")
        return value


class IntegrationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    connected: bool


class ApiKeyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Enter a key name.")
        return cleaned


class ApiKeyCreated(AccountKeySummary):
    key: str


class PasswordConfirmation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    password: str = Field(min_length=1, max_length=128)


def _settings(db, user: User) -> AccountSettings:
    settings = db.get(AccountSettings, user.id)
    if settings is None:
        settings = AccountSettings(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=AccountResponse)
def get_account(user: RequiredUser, db: DbSession) -> AccountResponse:
    settings = _settings(db, user)
    keys = db.scalars(
        select(UserApiKey)
        .where(UserApiKey.user_id == user.id, UserApiKey.revoked_at.is_(None))
        .order_by(UserApiKey.created_at.desc())
    ).all()
    organization = db.get(Organization, user.tenant_id)
    return AccountResponse(
        profile=AccountProfile(display_name=user.display_name, email=user.email),
        preferences=settings.preferences,
        integrations=settings.integrations,
        api_keys=[
            AccountKeySummary(
                id=key.id, name=key.name, prefix=key.prefix, created_at=key.created_at
            )
            for key in keys
        ],
        plan=organization.plan_id if organization else "free",
        role=user.role,
    )


@router.patch("/profile", response_model=AccountProfile)
def update_profile(
    payload: ProfileUpdate,
    user: RequiredUser,
    db: DbSession,
    background: BackgroundTasks,
) -> AccountProfile:
    settings = get_settings()
    email_changed = False
    if "email" in payload.model_fields_set and payload.email != user.email:
        if payload.email is None:
            raise ValidationError("Email cannot be empty.")
        if not payload.current_password or not verify_password(
            payload.current_password, user.password_hash
        ):
            raise UnauthorizedError("Confirm your current password to change email.")
        user.email = payload.email
        user.email_verified_at = None
        email_changed = True
    if "display_name" in payload.model_fields_set:
        user.display_name = payload.display_name
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError("An account with that email already exists.") from None
    db.refresh(user)
    if email_changed and user.email and settings.email_delivery != "disabled":
        token = auth_service.issue_email_token(db, user, auth_service.PURPOSE_VERIFY_EMAIL)
        background.add_task(send_verification_email, settings, to=user.email, token=token)
    record_event(
        db,
        action="account.profile.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        outcome={"email_changed": email_changed},
    )
    return AccountProfile(display_name=user.display_name, email=user.email)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def update_password(
    payload: PasswordUpdate, request: Request, user: RequiredUser, db: DbSession
) -> Response:
    if not verify_password(payload.current_password, user.password_hash):
        raise UnauthorizedError("Current password is incorrect.")
    token = request.cookies.get(get_settings().auth_cookie_name) or ""
    if not token:
        header = request.headers.get("authorization", "")
        if header.lower().startswith("bearer "):
            token = header[7:].strip()
    auth_service.change_password(db, user, payload.new_password, keep_token=token or None)
    record_event(
        db,
        action="account.password.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/preferences", response_model=dict[str, str | bool])
def update_preferences(
    payload: PreferencesUpdate, user: RequiredUser, db: DbSession
) -> dict[str, str | bool]:
    settings = _settings(db, user)
    settings.preferences = {**settings.preferences, **payload.model_dump(exclude_unset=True)}
    db.commit()
    record_event(
        db,
        action="account.preferences.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        outcome={"preferences": settings.preferences},
    )
    return settings.preferences


@router.put("/integrations/{kind}", response_model=dict[str, bool])
def update_integration(
    kind: str, payload: IntegrationUpdate, user: RequiredUser, db: DbSession
) -> dict[str, bool]:
    if kind not in {"kubernetes", "github", "prometheus"}:
        raise NotFoundError("Integration not found.")
    settings = _settings(db, user)
    settings.integrations = {**settings.integrations, kind: payload.connected}
    db.commit()
    record_event(
        db,
        action="account.integration.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"kind": kind},
        outcome={"connected": payload.connected},
    )
    return settings.integrations


@router.post("/api-keys", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
def create_api_key(payload: ApiKeyCreate, user: RequiredUser, db: DbSession) -> ApiKeyCreated:
    active_count = db.scalar(
        select(func.count())
        .select_from(UserApiKey)
        .where(UserApiKey.user_id == user.id, UserApiKey.revoked_at.is_(None))
    )
    if active_count is not None and active_count >= 10:
        raise ValidationError("Revoke an existing key before creating another.")
    raw_key = f"sre_{generate_token()}"
    record = UserApiKey(
        user_id=user.id,
        name=payload.name,
        prefix=raw_key[:12],
        key_hash=hash_token(raw_key),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    record_event(
        db,
        action="account.api_key.create",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"api_key_id": record.id, "prefix": record.prefix},
    )
    return ApiKeyCreated(
        id=record.id,
        name=record.name,
        prefix=record.prefix,
        created_at=record.created_at,
        key=raw_key,
    )


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(key_id: str, user: RequiredUser, db: DbSession) -> Response:
    record = db.scalar(
        select(UserApiKey).where(
            UserApiKey.id == key_id, UserApiKey.user_id == user.id, UserApiKey.revoked_at.is_(None)
        )
    )
    if record is None:
        raise NotFoundError("API key not found.")
    record.revoked_at = datetime.now(UTC)
    db.commit()
    record_event(
        db,
        action="account.api_key.revoke",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"api_key_id": record.id, "prefix": record.prefix},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(payload: PasswordConfirmation, user: RequiredUser, db: DbSession) -> Response:
    if not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Password is incorrect.")

    organization = db.get(Organization, user.tenant_id)
    membership = db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.organization_id == user.tenant_id,
            OrganizationMembership.user_id == user.id,
        )
    )
    if membership is not None and membership.role == "owner":
        owner_count = (
            db.scalar(
                select(func.count())
                .select_from(OrganizationMembership)
                .where(
                    OrganizationMembership.organization_id == user.tenant_id,
                    OrganizationMembership.role == "owner",
                )
            )
            or 0
        )
        member_count = (
            db.scalar(
                select(func.count())
                .select_from(OrganizationMembership)
                .where(OrganizationMembership.organization_id == user.tenant_id)
            )
            or 0
        )
        if owner_count <= 1 and member_count > 1:
            raise ConflictError(
                "Transfer workspace ownership to another member before deleting your account."
            )

    record_event(
        db,
        action="account.delete",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"organization_id": user.tenant_id},
    )
    db.delete(user)
    db.flush()
    if organization is not None:
        remaining_members = db.scalar(
            select(func.count())
            .select_from(OrganizationMembership)
            .where(OrganizationMembership.organization_id == organization.id)
        )
        if not remaining_members:
            db.delete(organization)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
