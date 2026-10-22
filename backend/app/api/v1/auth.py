"""Authentication endpoints: signup, login, refresh, recovery, and logout.

The session is delivered as an HttpOnly cookie (``settings.auth_cookie_name``)
so the token is never readable by client-side JavaScript and never appears in a
response body. A second, non-HttpOnly CSRF cookie is mirrored in the
``X-CSRF-Token`` header by the browser client and validated for unsafe requests
in production. Bearer API keys are not cookie-authenticated and are exempt.
"""

from __future__ import annotations

import secrets

from fastapi import APIRouter, BackgroundTasks, Request, Response, status
from fastapi.responses import RedirectResponse

from app.api.deps import DbSession, RequiredUser
from app.core.config import get_settings
from app.core.errors import NotFoundError, UnauthorizedError
from app.db.models import User
from app.schemas.auth import (
    AuthProvidersResponse,
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SignupRequest,
    UserOut,
    VerifyEmailRequest,
)
from app.services import auth as auth_service
from app.services import oauth as oauth_service
from app.services.audit import record_event
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])

_OAUTH_STATE_COOKIE = "sre_oauth_state"


def _set_session_cookies(response: Response, token: str, csrf_token: str) -> None:
    settings = get_settings()
    max_age = settings.auth_session_ttl_hours * 3600
    secure = not settings.is_local
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
    )
    # Readable by the same-origin client so it can mirror the value in a header.
    # It is not an authentication credential on its own.
    response.set_cookie(
        key=settings.auth_csrf_cookie_name,
        value=csrf_token,
        max_age=max_age,
        httponly=False,
        samesite="lax",
        secure=secure,
        path="/",
    )


def _clear_session_cookies(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(key=settings.auth_cookie_name, path="/")
    response.delete_cookie(key=settings.auth_csrf_cookie_name, path="/")


def _presented_token(request: Request) -> str | None:
    token = request.cookies.get(get_settings().auth_cookie_name)
    if token:
        return token
    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip() or None
    return None


def _send_verification(settings, db, user, background: BackgroundTasks) -> None:
    token = auth_service.issue_email_token(db, user, auth_service.PURPOSE_VERIFY_EMAIL)
    if settings.effective_background_jobs:
        from app.services.job_handlers import enqueue_verification_email

        enqueue_verification_email(db, to=user.email or "", token=token)
    else:
        background.add_task(
            send_verification_email, settings, to=user.email or "", token=token
        )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    db: DbSession,
    background: BackgroundTasks,
) -> AuthResponse:
    settings = get_settings()
    user = auth_service.create_user(
        db,
        email=payload.email,
        password=payload.password,
        display_name=payload.display_name,
    )
    verification_required = bool(settings.email_verification_required)
    if settings.email_delivery != "disabled":
        _send_verification(settings, db, user, background)
    if not verification_required:
        bundle = auth_service.create_session(
            db, user, user_agent=request.headers.get("user-agent")
        )
        _set_session_cookies(response, bundle.token, bundle.csrf_token)
    record_event(
        db,
        action="auth.signup",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        outcome={"verification_required": verification_required},
    )
    return AuthResponse(
        user=UserOut.model_validate(user),
        verification_required=verification_required,
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: DbSession,
) -> AuthResponse:
    user = auth_service.authenticate(db, email=payload.email, password=payload.password)
    bundle = auth_service.create_session(
        db, user, user_agent=request.headers.get("user-agent")
    )
    record_event(
        db,
        action="auth.login",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
    )
    _set_session_cookies(response, bundle.token, bundle.csrf_token)
    return AuthResponse(user=UserOut.model_validate(user))


@router.post("/refresh", response_model=AuthResponse)
def refresh(request: Request, response: Response, db: DbSession) -> AuthResponse:
    settings = get_settings()
    current = request.cookies.get(settings.auth_cookie_name)
    bundle = auth_service.rotate_session(
        db, current, user_agent=request.headers.get("user-agent")
    )
    user = db.get(User, bundle.session.user_id)
    if user is None:
        raise UnauthorizedError("Session expired. Sign in again.")
    record_event(
        db,
        action="auth.session.refresh",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
        resource={"session_id": bundle.session.id, "rotated_from": bundle.session.rotated_from_id},
    )
    _set_session_cookies(response, bundle.token, bundle.csrf_token)
    return AuthResponse(user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, db: DbSession) -> Response:
    token = _presented_token(request)
    user = auth_service.resolve_session(db, token)
    auth_service.revoke_session(db, token)
    if user is not None:
        record_event(
            db,
            action="auth.logout",
            actor="user",
            decision="allow",
            user_id=user.id,
            tenant_id=user.tenant_id,
        )
    cleared = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_session_cookies(cleared)
    return cleared


@router.get("/me", response_model=UserOut)
def me(user: RequiredUser) -> UserOut:
    return UserOut.model_validate(user)


@router.get("/providers", response_model=AuthProvidersResponse)
def providers() -> AuthProvidersResponse:
    """Return only OAuth providers that have server-side credentials."""

    return AuthProvidersResponse(providers=get_settings().oauth_providers)


def _oauth_error_redirect(reason: str) -> RedirectResponse:
    settings = get_settings()
    return RedirectResponse(
        f"{settings.app_base_url.rstrip('/')}/login?oauth_error={reason}",
        status_code=303,
    )


def _clear_oauth_state(response: Response) -> None:
    response.delete_cookie(key=_OAUTH_STATE_COOKIE, path="/api/v1/auth/oauth")


@router.get("/oauth/{provider}/start", include_in_schema=False)
def oauth_start(provider: str) -> RedirectResponse:
    settings = get_settings()
    if provider not in settings.oauth_providers:
        raise NotFoundError("OAuth provider is not configured.")
    state = secrets.token_urlsafe(32)
    response = RedirectResponse(
        oauth_service.authorize_url(settings, provider, state), status_code=302
    )
    response.set_cookie(
        key=_OAUTH_STATE_COOKIE,
        value=state,
        max_age=600,
        httponly=True,
        samesite="lax",
        secure=not settings.is_local,
        path="/api/v1/auth/oauth",
    )
    response.headers["Cache-Control"] = "no-store"
    return response


@router.get("/oauth/{provider}/callback", include_in_schema=False)
def oauth_callback(
    provider: str,
    request: Request,
    db: DbSession,
    code: str | None = None,
    state: str | None = None,
) -> RedirectResponse:
    settings = get_settings()
    expected = request.cookies.get(_OAUTH_STATE_COOKIE, "")
    state_valid = bool(
        expected
        and state
        and len(state) <= 256
        and secrets.compare_digest(expected, state)
    )
    if provider not in settings.oauth_providers or not state_valid or not code:
        response = _oauth_error_redirect("oauth_state_invalid")
        _clear_oauth_state(response)
        return response

    try:
        access_token = oauth_service.exchange_code(settings, provider, code)
        profile = oauth_service.fetch_profile(provider, access_token)
        user = auth_service.create_external_user(
            db,
            email=str(profile["email"]),
            display_name=profile.get("display_name"),
            external_id=f"{provider}:{profile['subject']}",
        )
        bundle = auth_service.create_session(
            db, user, user_agent=request.headers.get("user-agent")
        )
        record_event(
            db,
            action="auth.oauth.login",
            actor="user",
            decision="allow",
            user_id=user.id,
            tenant_id=user.tenant_id,
            resource={"provider": provider},
        )
        response = RedirectResponse(
            f"{settings.app_base_url.rstrip('/')}/dashboard", status_code=303
        )
        _set_session_cookies(response, bundle.token, bundle.csrf_token)
    except Exception:  # noqa: BLE001 - normalize every provider/account failure
        # Never put provider errors, tokens, or email addresses in the redirect.
        response = _oauth_error_redirect("oauth_failed")
    _clear_oauth_state(response)
    response.headers["Cache-Control"] = "no-store"
    return response


@router.post("/verify-email", response_model=UserOut)
def verify_email(payload: VerifyEmailRequest, db: DbSession) -> UserOut:
    user = auth_service.verify_email(db, payload.token)
    record_event(
        db,
        action="auth.email.verify",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
    )
    return UserOut.model_validate(user)


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    user: RequiredUser, db: DbSession, background: BackgroundTasks
) -> MessageResponse:
    if user.email_verified_at is not None:
        return MessageResponse(message="Email is already verified.")
    settings = get_settings()
    if not user.email:
        return MessageResponse(message="No email address is available.")
    _send_verification(settings, db, user, background)
    record_event(
        db,
        action="auth.email.resend",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
    )
    return MessageResponse(message="If delivery is configured, a verification email is on its way.")


@router.post("/forgot-password", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    payload: ForgotPasswordRequest, db: DbSession, background: BackgroundTasks
) -> MessageResponse:
    settings = get_settings()
    user = auth_service.get_user_by_email(db, payload.email)
    # Always return the same response so the endpoint cannot enumerate accounts.
    if user is not None and user.is_active and user.email:
        token = auth_service.issue_email_token(
            db, user, auth_service.PURPOSE_RESET_PASSWORD
        )
        if settings.effective_background_jobs:
            from app.services.job_handlers import enqueue_password_reset_email

            enqueue_password_reset_email(db, to=user.email, token=token)
        else:
            background.add_task(
                send_password_reset_email, settings, to=user.email, token=token
            )
        record_event(
            db,
            action="auth.password.reset.request",
            actor="user",
            decision="allow",
            user_id=user.id,
            tenant_id=user.tenant_id,
        )
    return MessageResponse(
        message="If an account exists for that email, a reset link has been sent."
    )


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(payload: ResetPasswordRequest, db: DbSession) -> Response:
    user = auth_service.reset_password(db, payload.token, payload.password)
    record_event(
        db,
        action="auth.password.reset",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=user.tenant_id,
    )
    cleared = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_session_cookies(cleared)
    return cleared
