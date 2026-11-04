"""Shared FastAPI dependencies."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Query, Request
from sqlalchemy.orm import Session

from app.auth.permissions import has_permission
from app.core.config import get_settings
from app.core.errors import AppError, ForbiddenError, NotFoundError, UnauthorizedError
from app.db.models import User, Workspace, WorkspaceMembership
from app.db.session import get_db
from app.schemas.common import PageParams
from app.services import auth as auth_service

DbSession = Annotated[Session, Depends(get_db)]


def page_params(
    page: int = Query(default=1, ge=1, description="1-based page number"),
    page_size: int = Query(default=25, ge=1, le=200, description="Items per page"),
) -> PageParams:
    return PageParams(page=page, page_size=page_size)


Pagination = Annotated[PageParams, Depends(page_params)]


def _bearer_token(request: Request) -> str | None:
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        token = header[7:].strip()
        return token or None
    return None


def get_current_user(request: Request, db: DbSession) -> User | None:
    """Resolve the signed-in user from the session cookie or a bearer token.

    Returns ``None`` when there is no valid session; it never raises, so it can
    back both optional and required dependencies.
    """
    settings = get_settings()
    cookie_token = request.cookies.get(settings.auth_cookie_name)
    if cookie_token:
        return auth_service.resolve_session(db, cookie_token)
    bearer_token = _bearer_token(request)
    return auth_service.resolve_session(db, bearer_token) or auth_service.resolve_api_key(
        db, bearer_token
    )


CurrentUser = Annotated[User | None, Depends(get_current_user)]


def require_user(user: CurrentUser) -> User:
    if user is None:
        raise UnauthorizedError("Authentication required.")
    return user


RequiredUser = Annotated[User, Depends(require_user)]


def require_admin(user: RequiredUser) -> User:
    if user.role not in {"owner", "admin"}:
        raise ForbiddenError(
            "Administrator role required.",
            details={"required_role": "owner or admin", "current_role": user.role},
        )
    return user


AdminUser = Annotated[User, Depends(require_admin)]


def require_owner(user: RequiredUser) -> User:
    if user.role != "owner":
        raise ForbiddenError(
            "Workspace owner role required.",
            details={"required_role": "owner", "current_role": user.role},
        )
    return user


OwnerUser = Annotated[User, Depends(require_owner)]


def require_operator(user: RequiredUser) -> User:
    """Members and above may change investigation state; viewers are read-only."""

    if user.role not in {"owner", "admin", "member"}:
        raise ForbiddenError(
            "Your workspace role is read-only.",
            details={"required_role": "member or above", "current_role": user.role},
        )
    return user


OperatorUser = Annotated[User, Depends(require_operator)]


def enforce_auth(user: CurrentUser) -> None:
    """Gate a route behind a session when auth is enabled.

    Intentionally a no-op in local/test environments when the flag is off, so
    the demo and test suite keep working without credentials. Production always
    requires authentication even if ``AUTH_REQUIRED`` was accidentally left
    unset. Attach with ``dependencies=[Depends(enforce_auth)]``.
    """
    settings = get_settings()
    if (settings.auth_required or settings.environment == "production") and user is None:
        raise UnauthorizedError("Authentication required.")


@dataclass(frozen=True)
class WorkspaceContext:
    """The one workspace a request acts on, plus the caller's role in it."""

    workspace: Workspace
    role: str

    @property
    def workspace_id(self) -> str:
        return self.workspace.id


def _workspace_not_found() -> NotFoundError:
    # Nonexistent workspaces and non-member access raise this identical
    # error so the two cases are indistinguishable from the outside.
    return NotFoundError(
        "Workspace not found.",
        details={"code": "workspace_not_found"},
    )


def _resolve_membership(
    db: Session, user: User, workspace: Workspace | None
) -> WorkspaceContext:
    if workspace is None:
        raise _workspace_not_found()
    membership = (
        db.query(WorkspaceMembership)
        .filter(
            WorkspaceMembership.workspace_id == workspace.id,
            WorkspaceMembership.user_id == user.id,
        )
        .first()
    )
    if membership is None:
        raise _workspace_not_found()
    return WorkspaceContext(workspace=workspace, role=membership.role)


def workspace_from_path(
    workspace_slug: str, user: RequiredUser, db: DbSession
) -> WorkspaceContext:
    """Resolve the workspace named by the ``{workspace_slug}`` URL segment."""
    workspace = db.query(Workspace).filter(Workspace.slug == workspace_slug).first()
    return _resolve_membership(db, user, workspace)


WorkspaceFromPath = Annotated[WorkspaceContext, Depends(workspace_from_path)]


def workspace_from_request(
    request: Request, user: RequiredUser, db: DbSession
) -> WorkspaceContext:
    """Resolve the workspace for legacy unprefixed routes.

    Order: the ``X-Workspace-Id`` header, else the user's only workspace,
    else 400 ``workspace_not_selected``. A workspace id sent in a request
    body or query string is never trusted.
    """
    header_value = request.headers.get("x-workspace-id")
    if header_value:
        workspace = db.query(Workspace).filter(Workspace.id == header_value).first()
        return _resolve_membership(db, user, workspace)

    memberships = (
        db.query(WorkspaceMembership)
        .filter(WorkspaceMembership.user_id == user.id)
        .all()
    )
    if len(memberships) == 1:
        workspace = db.get(Workspace, memberships[0].workspace_id)
        return _resolve_membership(db, user, workspace)

    raise AppError(
        "Select a workspace before using this endpoint.",
        status_code=400,
        details={"code": "workspace_not_selected"},
    )


WorkspaceFromRequest = Annotated[WorkspaceContext, Depends(workspace_from_request)]


def require_workspace_permission(permission: str):
    """Build a dependency that gates a route behind a workspace permission."""

    def checker(context: WorkspaceContext) -> WorkspaceContext:
        if not has_permission(context.role, permission):
            raise ForbiddenError(
                "Your workspace role does not allow this action.",
                details={"required_permission": permission, "role": context.role},
            )
        return context

    return checker
