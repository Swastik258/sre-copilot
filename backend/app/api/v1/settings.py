"""Non-secret workspace settings.

Only operational preferences are writable here. Provider keys and tokens stay
in the server environment and are never returned or accepted by this API.
Settings are scoped to the signed-in user's tenant; writes require an admin.
"""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.api.deps import AdminUser, DbSession, RequiredUser
from app.core.config import get_settings
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.services import audit as audit_service
from app.services import settings_store
from app.services.integrations import integration_statuses

router = APIRouter(prefix="/settings", tags=["settings"])


def _response(db: Session, tenant_id: str) -> SettingsResponse:
    settings = get_settings()
    override = settings_store.get_ai_privacy_override(db, tenant_id)
    return SettingsResponse(
        ai_provider=settings.ai_provider,
        ai_model=settings.ai_model,
        ai_privacy_mode=(
            settings.ai_privacy_mode if override is None else override
        ),
        ai_privacy_source="override" if override is not None else "environment",
        audit_retention_days=settings_store.get_audit_retention_days(db, tenant_id),
        default_environment=settings_store.get_default_environment(db, tenant_id),
        auth_required=settings.auth_required,
        rate_limit_per_minute=settings.effective_rate_limit,
        redaction_enabled=settings.redaction_enabled,
        demo_mode=settings.demo_mode,
        integrations=integration_statuses(settings).integrations,
    )


@router.get("", response_model=SettingsResponse)
def get_settings_endpoint(db: DbSession, user: RequiredUser) -> SettingsResponse:
    return _response(db, user.tenant_id)


@router.patch("", response_model=SettingsResponse)
def update_settings(
    payload: SettingsUpdate,
    db: DbSession,
    user: AdminUser,
) -> SettingsResponse:
    changes = payload.model_dump(exclude_unset=True)
    settings_store.update_preferences(
        db,
        tenant_id=user.tenant_id,
        audit_retention_days=payload.audit_retention_days,
        ai_privacy_mode=payload.ai_privacy_mode,
        default_environment=payload.default_environment,
        clear_default_environment=(
            "default_environment" in changes
            and payload.default_environment is None
        ),
    )
    audit_service.record_event(
        db,
        action="settings.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"fields": sorted(changes)},
    )
    return _response(db, user.tenant_id)
