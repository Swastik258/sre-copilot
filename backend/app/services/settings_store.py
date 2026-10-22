"""Editable, non-secret application settings.

Credentials remain environment-only. These preferences are safe to persist and
change at runtime: audit retention and AI privacy mode currently.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import AppSetting

PREFERENCES_KEY = "preferences"
DEFAULT_AUDIT_RETENTION_DAYS = 30


def _key(tenant_id: str | None) -> str:
    return f"{PREFERENCES_KEY}:{tenant_id}" if tenant_id else PREFERENCES_KEY


def _preferences(db: Session, tenant_id: str | None = "default") -> dict[str, Any]:
    row = db.get(AppSetting, _key(tenant_id))
    if row is None and tenant_id == "default":
        # Backward compatibility for settings written before tenant scoping.
        row = db.get(AppSetting, PREFERENCES_KEY)
    return dict(row.value) if row is not None and isinstance(row.value, dict) else {}


def get_audit_retention_days(db: Session, tenant_id: str = "default") -> int:
    value = _preferences(db, tenant_id).get("audit_retention_days")
    if isinstance(value, int) and not isinstance(value, bool):
        return max(1, min(3650, value))
    return DEFAULT_AUDIT_RETENTION_DAYS


def get_ai_privacy_override(db: Session, tenant_id: str = "default") -> bool | None:
    value = _preferences(db, tenant_id).get("ai_privacy_mode")
    return value if isinstance(value, bool) else None


def get_default_environment(db: Session, tenant_id: str = "default") -> str | None:
    value = _preferences(db, tenant_id).get("default_environment")
    return value.strip() if isinstance(value, str) and value.strip() else None


def update_preferences(
    db: Session,
    *,
    tenant_id: str = "default",
    audit_retention_days: int | None = None,
    ai_privacy_mode: bool | None = None,
    default_environment: str | None = None,
    clear_default_environment: bool = False,
) -> dict[str, Any]:
    current = _preferences(db, tenant_id)
    if audit_retention_days is not None:
        current["audit_retention_days"] = max(1, min(3650, audit_retention_days))
    if ai_privacy_mode is not None:
        current["ai_privacy_mode"] = ai_privacy_mode
    if default_environment is not None:
        current["default_environment"] = default_environment.strip()[:120] or None
    elif clear_default_environment:
        current["default_environment"] = None

    key = _key(tenant_id)
    row = db.get(AppSetting, key)
    if row is None:
        row = AppSetting(key=key, value=current)
        db.add(row)
    else:
        row.value = current
        db.add(row)
    db.commit()
    return current


def effective_ai_privacy_mode(db: Session, tenant_id: str = "default") -> bool:
    override = get_ai_privacy_override(db, tenant_id)
    return get_settings().ai_privacy_mode if override is None else override
