from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import DbSession, RequiredUser
from app.auth.permissions import has_permission
from app.core.errors import AppError, ForbiddenError, NotFoundError
from app.db.models import Organization, OrganizationMembership

_WORKSPACE_NOT_FOUND = "Workspace not found."


def _not_found() -> NotFoundError:
    return NotFoundError(_WORKSPACE_NOT_FOUND)


def _membership_for(
    db: Session, *, workspace_id: str, user_id: str
) -> OrganizationMembership | None:
    return db.scalar(
        select(OrganizationMembership).where(
            OrganizationMembership.organization_id == workspace_id,
            OrganizationMembership.user_id == user_id,
        )
    )


def _only_membership(db: Session, *, user_id: str) -> OrganizationMembership:
    memberships = list(
        db.scalars(
            select(OrganizationMembership)
            .where(OrganizationMembership.user_id == user_id)
            .order_by(OrganizationMembership.created_at, OrganizationMembership.id)
            .limit(2)
        )
    )
    if len(memberships) != 1:
        raise AppError(
            "Select a workspace to continue.",
            code="workspace_not_selected",
            status_code=400,
        )
    return memberships[0]


def get_current_workspace(
    request: Request,
    db: DbSession,
    user: RequiredUser,
) -> OrganizationMembership:
    """Resolve the request workspace and require the current user to belong to it."""
    workspace_slug = request.path_params.get("slug")
    workspace_id = request.headers.get("X-Workspace-Id")

    if workspace_slug:
        organization = db.scalar(select(Organization).where(Organization.slug == workspace_slug))
        if organization is None:
            raise _not_found()
        membership = _membership_for(db, workspace_id=organization.id, user_id=user.id)
    elif workspace_id:
        membership = _membership_for(db, workspace_id=workspace_id, user_id=user.id)
    else:
        return _only_membership(db, user_id=user.id)

    if membership is None:
        raise _not_found()
    return membership


CurrentWorkspace = Annotated[OrganizationMembership, Depends(get_current_workspace)]


def require_workspace_permission(permission: str) -> Callable[..., OrganizationMembership]:
    def dependency(member: CurrentWorkspace) -> OrganizationMembership:
        if not has_permission(member, permission):
            raise ForbiddenError("Your workspace role does not permit this action.")
        return member

    return dependency
