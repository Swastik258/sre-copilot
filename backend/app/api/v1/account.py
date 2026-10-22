"""Authenticated customer profile, preferences, integration flags, and API keys."""

from __future__ import annotations

import re
from datetime import UTC, datetime

from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession, RequiredUser
from app.core.config import get_settings
from app.core.errors import ConflictError, NotFoundError, UnauthorizedError, ValidationError
from app.db.models import AccountSettings, AuthSession, User, UserApiKey
from app.security.passwords import hash_password, verify_password
from app.security.tokens import generate_token, hash_token

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
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


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
        select(UserApiKey).where(
            UserApiKey.user_id == user.id, UserApiKey.revoked_at.is_(None)
        ).order_by(UserApiKey.created_at.desc())
    ).all()
    return AccountResponse(
        profile=AccountProfile(display_name=user.display_name, email=user.email),
        preferences=settings.preferences,
        integrations=settings.integrations,
        api_keys=[
            AccountKeySummary(id=key.id, name=key.name, prefix=key.prefix, created_at=key.created_at)
            for key in keys
        ],
    )


@router.patch("/profile", response_model=AccountProfile)
def update_profile(
    payload: ProfileUpdate, user: RequiredUser, db: DbSession
) -> AccountProfile:
    if "email" in payload.model_fields_set and payload.email != user.email:
        if payload.email is None:
            raise ValidationError("Email cannot be empty.")
        if not payload.current_password or not verify_password(payload.current_password, user.password_hash):
            raise UnauthorizedError("Confirm your current password to change email.")
        user.email = payload.email
    if "display_name" in payload.model_fields_set:
        user.display_name = payload.display_name
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError("An account with that email already exists.") from None
    db.refresh(user)
    return AccountProfile(display_name=user.display_name, email=user.email)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def update_password(
    payload: PasswordUpdate, request: Request, user: RequiredUser, db: DbSession
) -> Response:
    if not verify_password(payload.current_password, user.password_hash):
        raise UnauthorizedError("Current password is incorrect.")
    user.password_hash = hash_password(payload.new_password)
    token = request.cookies.get(get_settings().auth_cookie_name) or ""
    if not token:
        header = request.headers.get("authorization", "")
        if header.lower().startswith("bearer "):
            token = header[7:].strip()
    token_hash = hash_token(token) if token else ""
    db.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.token_hash != token_hash)
        .values(revoked_at=datetime.now(UTC))
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/preferences", response_model=dict[str, str | bool])
def update_preferences(
    payload: PreferencesUpdate, user: RequiredUser, db: DbSession
) -> dict[str, str | bool]:
    settings = _settings(db, user)
    settings.preferences = {**settings.preferences, **payload.model_dump(exclude_unset=True)}
    db.commit()
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
    return settings.integrations


@router.post("/api-keys", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
def create_api_key(payload: ApiKeyCreate, user: RequiredUser, db: DbSession) -> ApiKeyCreated:
    active_count = db.scalar(
        select(func.count()).select_from(UserApiKey).where(
            UserApiKey.user_id == user.id, UserApiKey.revoked_at.is_(None)
        )
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
    return ApiKeyCreated(
        id=record.id,
        name=record.name,
        prefix=record.prefix,
        created_at=record.created_at,
        key=raw_key,
    )


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(key_id: str, user: RequiredUser, db: DbSession) -> Response:
    record = db.scalar(select(UserApiKey).where(
        UserApiKey.id == key_id, UserApiKey.user_id == user.id, UserApiKey.revoked_at.is_(None)
    ))
    if record is None:
        raise NotFoundError("API key not found.")
    record.revoked_at = datetime.now(UTC)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    payload: PasswordConfirmation, user: RequiredUser, db: DbSession
) -> Response:
    if not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Password is incorrect.")
    if user.role == "admin":
        other_admins = db.scalar(
            select(func.count()).select_from(User).where(
                User.role == "admin", User.is_active.is_(True), User.id != user.id
            )
        ) or 0
        if other_admins == 0:
            raise ConflictError("The last active administrator cannot delete their account.")
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
