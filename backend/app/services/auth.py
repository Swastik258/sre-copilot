"""Local (self-hosted) authentication: accounts, sessions, and recovery.

Security properties:
* Passwords use Argon2id; legacy scrypt/PBKDF2 hashes are upgraded on login.
* Session and email tokens are random and stored only as SHA-256 hashes.
* Sessions expire after an absolute TTL and an idle TTL, can be rotated, and are
  revoked on password reset or account deactivation.
* Failed logins are counted per account and trigger a temporary lockout.
* Verification and reset tokens are single-use and purpose-bound.
"""

from __future__ import annotations

import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import (
    ConflictError,
    ForbiddenError,
    RateLimitedError,
    UnauthorizedError,
)
from app.db.models import (
    AuthSession,
    EmailToken,
    Organization,
    OrganizationMembership,
    User,
    UserApiKey,
)
from app.security.password_policy import validate_password_strength
from app.security.passwords import hash_password, needs_rehash, verify_password
from app.security.tokens import generate_token, hash_token
from app.services.audit import record_event

ROLE_OWNER = "owner"
ROLE_ADMIN = "admin"
ROLE_MEMBER = "member"
ROLE_VIEWER = "viewer"
ASSIGNABLE_ROLES = (ROLE_OWNER, ROLE_ADMIN, ROLE_MEMBER, ROLE_VIEWER)
ADMIN_ROLES = (ROLE_OWNER, ROLE_ADMIN)
OPERATOR_ROLES = (ROLE_OWNER, ROLE_ADMIN, ROLE_MEMBER)

PURPOSE_VERIFY_EMAIL = "verify_email"
PURPOSE_RESET_PASSWORD = "reset_password"
TOKEN_PURPOSES = (PURPOSE_VERIFY_EMAIL, PURPOSE_RESET_PASSWORD)

_SLUG_RE = re.compile(r"[^a-z0-9]+")


@dataclass(frozen=True)
class SessionBundle:
    token: str
    csrf_token: str
    session: AuthSession


def _now() -> datetime:
    return datetime.now(UTC)


def _as_aware(value: datetime) -> datetime:
    """SQLite returns naive datetimes even for timezone-aware columns."""
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def _slugify(value: str) -> str:
    slug = _SLUG_RE.sub("-", value.strip().lower()).strip("-")
    return (slug or "workspace")[:72]


def _unique_slug(db: Session, base: str) -> str:
    candidate = _slugify(base)
    if db.scalar(select(Organization.id).where(Organization.slug == candidate)) is None:
        return candidate
    for _ in range(5):
        candidate = f"{_slugify(base)[:64]}-{secrets.token_hex(3)}"
        if db.scalar(select(Organization.id).where(Organization.slug == candidate)) is None:
            return candidate
    return f"{_slugify(base)[:48]}-{secrets.token_hex(6)}"


def create_organization(
    db: Session,
    *,
    name: str,
    owner: User,
    plan_id: str = "free",
    commit: bool = True,
) -> Organization:
    organization = Organization(
        name=name.strip()[:120] or "Workspace",
        slug=_unique_slug(db, name),
        plan_id=plan_id,
        created_by=owner.id,
    )
    db.add(organization)
    db.flush()
    db.add(
        OrganizationMembership(
            organization_id=organization.id,
            user_id=owner.id,
            role=ROLE_OWNER,
        )
    )
    if commit:
        db.commit()
        db.refresh(organization)
    return organization


def create_user(
    db: Session,
    *,
    email: str,
    password: str,
    display_name: str | None = None,
) -> User:
    email = email.strip().lower()
    validate_password_strength(password, email=email)
    if get_user_by_email(db, email) is not None:
        raise ConflictError("An account with that email already exists.")

    settings = get_settings()
    configured_tenant = (settings.default_tenant_id or "").strip()
    join_shared_workspace = configured_tenant not in {"", "default"}
    organization_id = configured_tenant if join_shared_workspace else str(uuid.uuid4())

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        display_name=display_name,
        password_hash=hash_password(password),
        is_active=True,
        role=ROLE_MEMBER if join_shared_workspace else ROLE_OWNER,
        tenant_id=organization_id,
        email_verified_at=None,
    )
    try:
        organization = db.get(Organization, organization_id) if join_shared_workspace else None
        if organization is None:
            # Each public signup owns a personal workspace, or a configured
            # shared workspace is created once. Teams are explicit
            # organizations, never an implicit shared "default" tenant.
            organization = Organization(
                id=organization_id,
                name=(
                    f"Workspace {organization_id}"
                    if join_shared_workspace
                    else f"{display_name.strip() if display_name else email.split('@')[0]}'s workspace"
                )[:120],
                slug=_unique_slug(
                    db,
                    organization_id
                    if join_shared_workspace
                    else (display_name or email.split("@")[0]),
                ),
                plan_id="free",
                created_by=user.id,
            )
        # Add both before flushing: SQLAlchemy orders the user insert before the
        # organization because organizations.created_by references users.
        db.add(user)
        if organization not in db:
            db.add(organization)
        db.flush()
        db.add(
            OrganizationMembership(
                organization_id=organization.id,
                user_id=user.id,
                role=user.role,
            )
        )
        db.commit()
    except IntegrityError:
        # Unique indexes on users.email, organizations.slug, and memberships
        # handle races between concurrent signups.
        db.rollback()
        raise ConflictError("An account with that email already exists.") from None
    db.refresh(user)
    return user


def create_external_user(
    db: Session,
    *,
    email: str,
    display_name: str | None,
    external_id: str,
) -> User:
    """Find or provision an account verified by an OAuth provider.

    Existing local accounts are linked on first federated login. A mismatched
    provider identity is rejected rather than silently merged.
    """

    email = email.strip().lower()
    external_id = external_id.strip()[:255]
    existing = get_user_by_email(db, email)
    if existing is not None:
        if existing.external_id and existing.external_id != external_id:
            raise ConflictError("This email is already linked to another identity.")
        if not existing.is_active:
            raise ForbiddenError("This account is deactivated.")
        if existing.external_id is None:
            existing.external_id = external_id
        if existing.email_verified_at is None:
            existing.email_verified_at = _now()
        db.commit()
        db.refresh(existing)
        return existing

    organization_id = str(uuid.uuid4())
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        display_name=(display_name or "").strip()[:120] or None,
        password_hash=None,
        external_id=external_id,
        is_active=True,
        role=ROLE_OWNER,
        tenant_id=organization_id,
        email_verified_at=_now(),
    )
    organization = Organization(
        id=organization_id,
        name=f"{user.display_name or email.split('@')[0]}'s workspace"[:120],
        slug=_unique_slug(db, user.display_name or email.split("@")[0]),
        plan_id="free",
        created_by=user.id,
    )
    try:
        db.add(user)
        db.add(organization)
        db.flush()
        db.add(
            OrganizationMembership(
                organization_id=organization.id,
                user_id=user.id,
                role=ROLE_OWNER,
            )
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "This account could not be linked. Try signing in locally."
        ) from None
    db.refresh(user)
    return user


def _new_csrf_token() -> tuple[str, str]:
    raw = generate_token()
    return raw, hash_token(raw)


def create_session(
    db: Session,
    user: User,
    *,
    user_agent: str | None = None,
    rotated_from_id: str | None = None,
) -> SessionBundle:
    settings = get_settings()
    token = generate_token()
    csrf_token, csrf_hash = _new_csrf_token()
    now = _now()
    agent = (user_agent or "").strip()[:300] or None
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_token(token),
        csrf_token_hash=csrf_hash,
        user_agent=agent,
        rotated_from_id=rotated_from_id,
        created_at=now,
        last_used_at=now,
        expires_at=now + timedelta(hours=settings.auth_session_ttl_hours),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionBundle(token=token, csrf_token=csrf_token, session=session)


def _active_session(db: Session, token: str | None) -> AuthSession | None:
    if not token:
        return None
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is None or session.revoked_at is not None:
        return None
    now = _now()
    if _as_aware(session.expires_at) <= now:
        return None
    settings = get_settings()
    idle_deadline = _as_aware(session.last_used_at) + timedelta(
        hours=settings.auth_session_idle_hours
    )
    if idle_deadline <= now:
        session.revoked_at = now
        db.commit()
        return None
    return session


def resolve_session(db: Session, token: str | None) -> User | None:
    """Return the active user for ``token``, or ``None`` if it is unusable."""
    session = _active_session(db, token)
    if session is None:
        return None
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        return None

    # Avoid a write on every request; five minutes is enough to enforce idle
    # expiry without turning read traffic into database churn.
    now = _now()
    if now - _as_aware(session.last_used_at) > timedelta(minutes=5):
        session.last_used_at = now
        db.commit()
    return user


def rotate_session(db: Session, token: str | None, *, user_agent: str | None = None) -> SessionBundle:
    """Revoke the current session and issue a fresh token + CSRF pair."""
    session = _active_session(db, token)
    if session is None:
        raise UnauthorizedError("Session expired. Sign in again.")
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError("Session expired. Sign in again.")
    session.revoked_at = _now()
    db.commit()
    return create_session(
        db,
        user,
        user_agent=user_agent or session.user_agent,
        rotated_from_id=session.id,
    )


def resolve_api_key(db: Session, token: str | None) -> User | None:
    """Resolve an active, hashed customer API key."""
    if not token:
        return None
    api_key = db.scalar(
        select(UserApiKey).where(
            UserApiKey.key_hash == hash_token(token),
            UserApiKey.revoked_at.is_(None),
        )
    )
    if api_key is None:
        return None
    user = db.get(User, api_key.user_id)
    if user is None or not user.is_active:
        return None
    return user


def _reset_login_failures(user: User) -> None:
    user.failed_login_count = 0
    user.locked_until = None


def authenticate(db: Session, *, email: str, password: str) -> User:
    settings = get_settings()
    user = get_user_by_email(db, email)
    now = _now()

    if user is not None and user.locked_until is not None:
        locked_until = _as_aware(user.locked_until)
        if locked_until > now:
            retry = max(1, int((locked_until - now).total_seconds()))
            raise RateLimitedError(
                "Too many failed sign-in attempts. Try again later.",
                details={"retry_after_seconds": retry},
            )

    # Always run the (constant-time) password check so a missing account and a
    # wrong password are indistinguishable in timing.
    valid = verify_password(password, user.password_hash if user else None)
    if not valid or user is None or not user.is_active:
        if user is not None:
            user.failed_login_count = (user.failed_login_count or 0) + 1
            just_locked = user.failed_login_count >= settings.auth_max_failed_logins
            if just_locked:
                user.locked_until = now + timedelta(minutes=settings.auth_lockout_minutes)
            db.commit()
            record_event(
                db,
                action="auth.login",
                actor="user",
                decision="deny",
                user_id=user.id,
                tenant_id=user.tenant_id,
                reason="invalid_credentials" if not just_locked else "account_locked",
            )
            if just_locked:
                raise RateLimitedError(
                    "Too many failed sign-in attempts. Try again later.",
                    details={"retry_after_seconds": settings.auth_lockout_minutes * 60},
                )
        raise UnauthorizedError("Invalid email or password.")

    if settings.email_verification_required and user.email_verified_at is None:
        raise ForbiddenError(
            "Verify your email address before signing in.",
            code="email_not_verified",
        )

    _reset_login_failures(user)
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
    db.commit()
    return user


def revoke_session(db: Session, token: str | None) -> bool:
    session = _active_session(db, token)
    if session is None:
        return False
    session.revoked_at = _now()
    db.commit()
    return True


def revoke_all_sessions(db: Session, user_id: str, *, except_token: str | None = None) -> int:
    filters = [AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None)]
    if except_token:
        filters.append(AuthSession.token_hash != hash_token(except_token))
    result = db.execute(
        update(AuthSession).where(*filters).values(revoked_at=_now())
    )
    db.commit()
    return int(result.rowcount or 0)


def set_password(db: Session, user: User, password: str) -> None:
    validate_password_strength(password, email=user.email)
    user.password_hash = hash_password(password)
    user.password_changed_at = _now()
    _reset_login_failures(user)
    db.commit()
    revoke_all_sessions(db, user.id)


def change_password(
    db: Session,
    user: User,
    password: str,
    *,
    keep_token: str | None = None,
) -> None:
    """Change a password while keeping the current session (if supplied)."""
    validate_password_strength(password, email=user.email)
    user.password_hash = hash_password(password)
    user.password_changed_at = _now()
    _reset_login_failures(user)
    db.commit()
    revoke_all_sessions(db, user.id, except_token=keep_token)


def issue_email_token(db: Session, user: User, purpose: str) -> str:
    """Create a single-use token and invalidate older unused tokens."""
    if purpose not in TOKEN_PURPOSES:
        raise ValueError("Unsupported token purpose.")
    settings = get_settings()
    now = _now()
    db.execute(
        update(EmailToken)
        .where(
            EmailToken.user_id == user.id,
            EmailToken.purpose == purpose,
            EmailToken.used_at.is_(None),
        )
        .values(used_at=now)
    )
    raw = generate_token()
    ttl = (
        timedelta(hours=settings.email_verification_ttl_hours)
        if purpose == PURPOSE_VERIFY_EMAIL
        else timedelta(minutes=settings.password_reset_ttl_minutes)
    )
    db.add(
        EmailToken(
            user_id=user.id,
            purpose=purpose,
            token_hash=hash_token(raw),
            expires_at=now + ttl,
        )
    )
    db.commit()
    return raw


def consume_email_token(db: Session, raw_token: str, purpose: str) -> User:
    if purpose not in TOKEN_PURPOSES:
        raise ValueError("Unsupported token purpose.")
    token = db.scalar(
        select(EmailToken).where(
            EmailToken.token_hash == hash_token(raw_token.strip()),
            EmailToken.purpose == purpose,
            EmailToken.used_at.is_(None),
        )
    )
    if token is None or _as_aware(token.expires_at) <= _now():
        raise ForbiddenError("This link is invalid or has expired.", code="invalid_token")
    user = db.get(User, token.user_id)
    if user is None or not user.is_active:
        raise ForbiddenError("This link is invalid or has expired.", code="invalid_token")
    token.used_at = _now()
    db.commit()
    return user


def verify_email(db: Session, raw_token: str) -> User:
    user = consume_email_token(db, raw_token, PURPOSE_VERIFY_EMAIL)
    user.email_verified_at = _now()
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, raw_token: str, password: str) -> User:
    user = consume_email_token(db, raw_token, PURPOSE_RESET_PASSWORD)
    set_password(db, user, password)
    return user
