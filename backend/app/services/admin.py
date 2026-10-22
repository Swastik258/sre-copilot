"""Administrator user and workspace management.

Owners/admins may manage users only inside their own active workspace. Owner
accounts are protected from demotion/removal by the last-owner guard, matching
the organization membership service. Cross-workspace administration is
intentionally not available through this API.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.db.models import (
    AuthSession,
    Organization,
    OrganizationMembership,
    User,
)
from app.schemas.admin import (
    AdminUserListResponse,
    AdminUserUpdate,
    TenantListResponse,
    TenantSummary,
)
from app.schemas.auth import UserOut
from app.services.audit import record_event

_PRIVILEGED = {"owner", "admin"}


def list_users(
    db: Session,
    admin: User,
    *,
    tenant_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> AdminUserListResponse:
    if tenant_id is not None and tenant_id != admin.tenant_id:
        raise ForbiddenError("You can only list users in your active workspace.")
    filters = [User.tenant_id == admin.tenant_id]
    total = db.scalar(select(func.count()).select_from(User).where(*filters)) or 0
    rows = list(
        db.scalars(
            select(User).where(*filters).order_by(User.created_at).offset(offset).limit(limit)
        )
    )
    return AdminUserListResponse(
        users=[UserOut.model_validate(row) for row in rows],
        total=total,
    )


def _active_privileged_count(db: Session, *, tenant_id: str, exclude_user_id: str) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.tenant_id == tenant_id,
                User.role.in_(tuple(_PRIVILEGED)),
                User.is_active.is_(True),
                User.id != exclude_user_id,
            )
        )
        or 0
    )


def update_user(db: Session, admin: User, user_id: str, payload: AdminUserUpdate) -> UserOut:
    target = db.get(User, user_id)
    if target is None:
        raise NotFoundError("User not found", details={"user_id": user_id})
    if target.tenant_id != admin.tenant_id:
        raise ForbiddenError("You can only manage users in your active workspace.")

    old_role = target.role
    old_active = target.is_active
    new_role = payload.role if payload.role is not None else target.role
    new_active = payload.is_active if payload.is_active is not None else target.is_active

    if payload.tenant_id is not None and payload.tenant_id != target.tenant_id:
        raise ForbiddenError("Use the organizations API to manage workspace membership.")

    if target.role == "owner" and admin.role != "owner":
        raise ForbiddenError("Only an owner can change another owner.")
    if new_role == "owner" and admin.role != "owner":
        raise ForbiddenError("Only an owner can grant the owner role.")

    if (
        target.role in _PRIVILEGED
        and (new_role not in _PRIVILEGED or new_active is False)
        and _active_privileged_count(db, tenant_id=admin.tenant_id, exclude_user_id=target.id) == 0
    ):
        raise ConflictError(
            "Cannot remove the last active workspace administrator.",
            details={"user_id": target.id},
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
    target.is_active = new_active
    membership = db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.organization_id == admin.tenant_id,
            OrganizationMembership.user_id == target.id,
        )
    )
    if membership is not None:
        membership.role = new_role
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
            "is_active": {"from": old_active, "to": target.is_active},
        },
    )
    return UserOut.model_validate(target)


def list_tenants(db: Session, admin: User) -> TenantListResponse:
    organization = db.get(Organization, admin.tenant_id)
    user_count = (
        db.scalar(select(func.count()).select_from(User).where(User.tenant_id == admin.tenant_id))
        or 0
    )
    if organization is None:
        return TenantListResponse(tenants=[], total=0)
    return TenantListResponse(
        tenants=[
            TenantSummary(
                tenant_id=organization.id,
                name=organization.name,
                user_count=user_count,
            )
        ],
        total=1,
    )
