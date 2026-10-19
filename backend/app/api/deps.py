"""Shared FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import UnauthorizedError
from app.db.models import User
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
    token = request.cookies.get(settings.auth_cookie_name) or _bearer_token(request)
    return auth_service.resolve_session(db, token)


CurrentUser = Annotated[User | None, Depends(get_current_user)]


def require_user(user: CurrentUser) -> User:
    if user is None:
        raise UnauthorizedError("Authentication required.")
    return user


RequiredUser = Annotated[User, Depends(require_user)]


def enforce_auth(user: CurrentUser) -> None:
    """Gate a route behind a session when ``auth_required`` is enabled.

    Intentionally a no-op when the flag is off, so the local demo and the test
    suite keep working without credentials. Attach with
    ``dependencies=[Depends(enforce_auth)]``.
    """
    if get_settings().auth_required and user is None:
        raise UnauthorizedError("Authentication required.")
