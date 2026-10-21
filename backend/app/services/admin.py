"""Administrator user and tenant management.

Only active admins can list users or change roles, tenants, and activation.
The last active admin cannot be demoted or deactivated, preventing a lockout.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError
from app.db.models import AuthSession, Investigation, User
from app.schemas.admin import (
    AdminUserListResponse,
    AdminUserUpdate,
    TenantListResponse,
    TenantSummary,
)
from app.schemas.auth import UserOut
from app.services.audit import record_event


def list_users(
    db: Session,
    *,
    tenant_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> AdminUserListResponse:
    filters = [User.tenant_id == tenant_id] if tenant_id else []
    total = db.scalar(select(func.count()).select_from(User).where(*filters)) or 0
    rows = list(
        db.scalars(
            select(User)
            .where(*filters)
            .order_by(User.created_at)
            .offset(offset)
            .limit(limit)
        )
    )
    return AdminUserListResponse(
        users=[UserOut.model_validate(row) for row in rows],
        total=total,
    )


def _active_admin_count(db: Session, *, exclude_user_id: str) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.role == "admin",
                User.is_active.is_(True),
                User.id != exclude_user_id,
            )
        )
        or 0
    )


def update_user(
    db: Session, admin: User, user_id: str, payload: AdminUserUpdate
) -> UserOut:
    target = db.get(User, user_id)
    if target is None:
        raise NotFoundError("User not found", details={"user_id": user_id})

    old_role = target.role
    old_tenant = target.tenant_id
    old_active = target.is_active

    new_role = payload.role if payload.role is not None else target.role
    new_active = payload.is_active if payload.is_active is not None else target.is_active
    new_tenant = payload.tenant_id if payload.tenant_id is not None else target.tenant_id

    if target.role == "admin" and (
        new_role != "admin" or new_active is False
    ) and _active_admin_count(db, exclude_user_id=target.id) == 0:
        raise ConflictError(
            "Cannot remove the last active administrator.",
            details={"user_id": target.id},
        )

    if new_tenant != old_tenant:
        db.execute(
            update(Investigation)
            .where(Investigation.user_id == target.id)
            .values(tenant_id=new_tenant)
        )
    if old_active and new_active is False:
        db.execute(
            update(AuthSession)
            .where(
                AuthSession.user_id == target.id,
                AuthSession.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )

    target.role = new_role
    target.tenant_id = new_tenant
    target.is_active = new_active
    db.add(target)
    db.commit()
    db.refresh(target)

    record_event(
        db,
        action="admin.user.update",
        actor="user",
        decision="allow",
        user_id=admin.id,
        tenant_id=admin.tenant_id,
        resource={"user_id": target.id},
        outcome={
            "role": {"from": old_role, "to": target.role},
            "tenant_id": {"from": old_tenant, "to": target.tenant_id},
            "is_active": {"from": old_active, "to": target.is_active},
        },
    )
    return UserOut.model_validate(target)


def list_tenants(db: Session) -> TenantListResponse:
    rows = list(
        db.execute(
            select(User.tenant_id, func.count())
            .group_by(User.tenant_id)
            .order_by(User.tenant_id)
        )
    )
    tenants = [
        TenantSummary(tenant_id=row[0], user_count=int(row[1])) for row in rows
    ]
    return TenantListResponse(tenants=tenants, total=len(tenants))
