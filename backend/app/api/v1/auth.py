"""Local authentication endpoints: signup, login, logout, and me.

The session is delivered as an HttpOnly cookie (``settings.auth_cookie_name``)
so the token is never readable by client-side JavaScript and never appears in a
response body. ``SameSite=Lax`` means the cookie is not sent on cross-site POSTs,
which blocks the common CSRF vector for these endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Request, Response, status

from app.api.deps import DbSession, RequiredUser
from app.core.config import get_settings
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserOut
from app.services import auth as auth_service
from app.services.audit import record_event

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.auth_session_ttl_hours * 3600,
        httponly=True,
        samesite="lax",
        # Secure cookies require HTTPS; keep them off for plain-HTTP local dev.
        secure=not settings.is_local,
        path="/",
    )


def _presented_token(request: Request) -> str | None:
    token = request.cookies.get(get_settings().auth_cookie_name)
    if token:
        return token
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip() or None
    return None


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    db: DbSession,
) -> AuthResponse:
    user = auth_service.create_user(
        db,
        email=payload.email,
        password=payload.password,
        display_name=payload.display_name,
    )
    token, _ = auth_service.create_session(
        db, user, user_agent=request.headers.get("user-agent")
    )
    record_event(db, action="auth.signup", actor="user", decision="allow", user_id=user.id)
    _set_session_cookie(response, token)
    return AuthResponse(user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: DbSession,
) -> AuthResponse:
    user = auth_service.authenticate(db, email=payload.email, password=payload.password)
    token, _ = auth_service.create_session(
        db, user, user_agent=request.headers.get("user-agent")
    )
    record_event(db, action="auth.login", actor="user", decision="allow", user_id=user.id)
    _set_session_cookie(response, token)
    return AuthResponse(user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, db: DbSession) -> Response:
    settings = get_settings()
    token = _presented_token(request)
    user = auth_service.resolve_session(db, token)
    auth_service.revoke_session(db, token)
    if user is not None:
        record_event(db, action="auth.logout", actor="user", decision="allow", user_id=user.id)
    cleared = Response(status_code=status.HTTP_204_NO_CONTENT)
    cleared.delete_cookie(key=settings.auth_cookie_name, path="/")
    return cleared


@router.get("/me", response_model=UserOut)
def me(user: RequiredUser) -> UserOut:
    return UserOut.model_validate(user)
