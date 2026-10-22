"""Organizations/workspaces, membership, and role management.

The membership table is the source of truth. ``User.tenant_id`` and
``User.role`` mirror the *active* membership so existing tenant-scoped queries
stay cheap; switching organizations updates that mirror. Owners cannot be
removed while they are the last owner, preventing workspace lockout.
"""

from __future__ import annotations

import re
import secrets
from typing import cast

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.models import Organization, OrganizationMembership, User
from app.schemas.organization import (
    MemberAdd,
    MemberUpdate,
    OrganizationCreate,
    OrganizationListResponse,
    OrganizationOut,
    OrganizationUpdate,
    OrgMemberOut,
    OrgMembersResponse,
    WorkspaceRole,
)
from app.services.auth import ADMIN_ROLES, ASSIGNABLE_ROLES, ROLE_OWNER

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(value: str) -> str:
    return (_SLUG_RE.sub("-", value.strip().lower()).strip("-") or "workspace")[:72]


def _unique_slug(db: Session, base: str) -> str:
    candidate = _slugify(base)
    if db.scalar(select(Organization.id).where(Organization.slug == candidate)) is None:
        return candidate
    for _ in range(5):
        candidate = f"{candidate[:64]}-{secrets.token_hex(3)}"
        if db.scalar(select(Organization.id).where(Organization.slug == candidate)) is None:
            return candidate
    return f"{_slugify(base)[:48]}-{secrets.token_hex(6)}"


def _membership(
    db: Session, *, organization_id: str, user_id: str
) -> OrganizationMembership | None:
    return db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.organization_id == organization_id,
            OrganizationMembership.user_id == user_id,
        )
    )


def require_membership(
    db: Session, user: User, organization_id: str, *, roles: tuple[str, ...] | None = None
) -> OrganizationMembership:
    membership = _membership(db, organization_id=organization_id, user_id=user.id)
    if membership is None:
        # Hide whether another workspace exists.
        raise NotFoundError("Workspace not found.")
    if roles is not None and membership.role not in roles:
        raise ForbiddenError(
            "Your workspace role does not permit this action.",
            details={
                "required_roles": list(roles),
                "current_role": membership.role,
            },
        )
    return membership


def _to_out(org: Organization, role: str) -> OrganizationOut:
    return OrganizationOut(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan_id=org.plan_id,
        role=cast(WorkspaceRole, role),
        created_at=org.created_at,
    )


def list_organizations(db: Session, user: User) -> OrganizationListResponse:
    rows = list(
        db.execute(
            select(Organization, OrganizationMembership.role)
            .join(
                OrganizationMembership,
                OrganizationMembership.organization_id == Organization.id,
            )
            .where(OrganizationMembership.user_id == user.id)
            .order_by(Organization.created_at)
        )
    )
    return OrganizationListResponse(
        organizations=[_to_out(org, role) for org, role in rows],
        total=len(rows),
        active_id=user.tenant_id,
    )


def create_organization(db: Session, user: User, payload: OrganizationCreate) -> OrganizationOut:
    org = Organization(
        name=payload.name.strip(),
        slug=_unique_slug(db, payload.name),
        plan_id="free",
        created_by=user.id,
    )
    db.add(org)
    db.flush()
    db.add(
        OrganizationMembership(
            organization_id=org.id,
            user_id=user.id,
            role=ROLE_OWNER,
        )
    )
    db.commit()
    db.refresh(org)
    return _to_out(org, ROLE_OWNER)


def get_organization(db: Session, user: User, organization_id: str) -> OrganizationOut:
    membership = require_membership(db, user, organization_id)
    org = db.get(Organization, organization_id)
    if org is None:
        raise NotFoundError("Workspace not found.")
    return _to_out(org, membership.role)


def update_organization(
    db: Session, user: User, organization_id: str, payload: OrganizationUpdate
) -> OrganizationOut:
    membership = require_membership(db, user, organization_id, roles=ADMIN_ROLES)
    org = db.get(Organization, organization_id)
    if org is None:
        raise NotFoundError("Workspace not found.")
    if payload.name is not None:
        org.name = payload.name.strip()
    db.commit()
    db.refresh(org)
    return _to_out(org, membership.role)


def _owner_count(db: Session, organization_id: str) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(OrganizationMembership)
            .where(
                OrganizationMembership.organization_id == organization_id,
                OrganizationMembership.role == ROLE_OWNER,
            )
        )
        or 0
    )


def list_members(db: Session, user: User, organization_id: str) -> OrgMembersResponse:
    require_membership(db, user, organization_id)
    rows = list(
        db.execute(
            select(OrganizationMembership, User)
            .join(User, User.id == OrganizationMembership.user_id)
            .where(OrganizationMembership.organization_id == organization_id)
            .order_by(OrganizationMembership.created_at)
        )
    )
    return OrgMembersResponse(
        members=[
            OrgMemberOut(
                user_id=member.user_id,
                email=target.email,
                display_name=target.display_name,
                role=cast(WorkspaceRole, member.role),
                is_active=target.is_active,
                created_at=member.created_at,
            )
            for member, target in rows
        ],
        total=len(rows),
    )


def add_member(db: Session, actor: User, organization_id: str, payload: MemberAdd) -> OrgMemberOut:
    actor_role = require_membership(db, actor, organization_id, roles=ADMIN_ROLES).role
    if payload.role == ROLE_OWNER and actor_role != ROLE_OWNER:
        raise ForbiddenError("Only an owner can add another owner.")
    target = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if target is None:
        raise NotFoundError("No account exists for that email. The person must sign up first.")
    existing = _membership(db, organization_id=organization_id, user_id=target.id)
    if existing is not None:
        raise ConflictError("That account is already a member of this workspace.")
    membership = OrganizationMembership(
        organization_id=organization_id,
        user_id=target.id,
        role=payload.role,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return OrgMemberOut(
        user_id=target.id,
        email=target.email,
        display_name=target.display_name,
        role=cast(WorkspaceRole, membership.role),
        is_active=target.is_active,
        created_at=membership.created_at,
    )


def update_member(
    db: Session,
    actor: User,
    organization_id: str,
    user_id: str,
    payload: MemberUpdate,
) -> OrgMemberOut:
    actor_role = require_membership(db, actor, organization_id, roles=ADMIN_ROLES).role
    if payload.role not in ASSIGNABLE_ROLES:
        raise ValidationError("Unsupported workspace role.")
    target_membership = _membership(db, organization_id=organization_id, user_id=user_id)
    if target_membership is None:
        raise NotFoundError("Workspace member not found.")
    if target_membership.role == ROLE_OWNER and actor_role != ROLE_OWNER:
        raise ForbiddenError("Only an owner can change another owner's role.")
    if payload.role == ROLE_OWNER and actor_role != ROLE_OWNER:
        raise ForbiddenError("Only an owner can grant the owner role.")
    if (
        target_membership.role == ROLE_OWNER
        and payload.role != ROLE_OWNER
        and _owner_count(db, organization_id) <= 1
    ):
        raise ConflictError("The last workspace owner cannot be demoted.")
    target_membership.role = payload.role
    target = db.get(User, user_id)
    if target is None:
        raise NotFoundError("Workspace member not found.")
    if target.tenant_id == organization_id:
        target.role = payload.role
    db.commit()
    db.refresh(target_membership)
    return OrgMemberOut(
        user_id=target.id,
        email=target.email,
        display_name=target.display_name,
        role=target_membership.role,
        is_active=target.is_active,
        created_at=target_membership.created_at,
    )


def remove_member(db: Session, actor: User, organization_id: str, user_id: str) -> None:
    actor_role = require_membership(db, actor, organization_id, roles=ADMIN_ROLES).role
    target_membership = _membership(db, organization_id=organization_id, user_id=user_id)
    if target_membership is None:
        raise NotFoundError("Workspace member not found.")
    if target_membership.role == ROLE_OWNER:
        if actor_role != ROLE_OWNER:
            raise ForbiddenError("Only an owner can remove another owner.")
        if _owner_count(db, organization_id) <= 1:
            raise ConflictError("The last workspace owner cannot be removed.")
    target = db.get(User, user_id)
    if target is None:
        raise NotFoundError("Workspace member not found.")
    db.delete(target_membership)
    db.flush()
    remaining = db.scalars(
        select(OrganizationMembership)
        .where(OrganizationMembership.user_id == user_id)
        .order_by(OrganizationMembership.created_at)
    ).all()
    if target.tenant_id == organization_id:
        if remaining:
            target.tenant_id = remaining[0].organization_id
            target.role = remaining[0].role
        else:
            # Never leave an account without a workspace. The removed user
            # becomes owner of a fresh personal workspace.
            personal = Organization(
                name=f"{target.display_name or (target.email or 'Personal').split('@')[0]}'s workspace"[
                    :120
                ],
                slug=_unique_slug(db, target.display_name or target.email or "personal"),
                plan_id="free",
                created_by=target.id,
            )
            db.add(personal)
            db.flush()
            db.add(
                OrganizationMembership(
                    organization_id=personal.id,
                    user_id=target.id,
                    role=ROLE_OWNER,
                )
            )
            target.tenant_id = personal.id
            target.role = ROLE_OWNER
    db.commit()


def switch_organization(db: Session, user: User, organization_id: str) -> User:
    membership = require_membership(db, user, organization_id)
    user.tenant_id = organization_id
    user.role = membership.role
    db.commit()
    db.refresh(user)
    return user
