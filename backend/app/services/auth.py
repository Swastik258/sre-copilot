"""Local (self-hosted) authentication: accounts and browser sessions.

Security properties:
* Passwords are salted and hashed (scrypt, see ``app.security.passwords``).
* Session tokens are random and only stored as a SHA-256 hash.
* Sessions expire after ``settings.auth_session_ttl_hours`` and can be revoked.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import ConflictError, UnauthorizedError
from app.db.models import AuthSession, User
from app.security.passwords import hash_password, verify_password
from app.security.tokens import generate_token, hash_token


def _now() -> datetime:
    return datetime.now(UTC)


def _as_aware(value: datetime) -> datetime:
    """SQLite returns naive datetimes even for timezone-aware columns."""
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def create_user(
    db: Session,
    *,
    email: str,
    password: str,
    display_name: str | None = None,
) -> User:
    email = email.strip().lower()
    if get_user_by_email(db, email) is not None:
        raise ConflictError("An account with that email already exists.")
    user = User(
        email=email,
        display_name=display_name,
        password_hash=hash_password(password),
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Unique index on users.email — handles the race between the check and
        # the insert.
        db.rollback()
        raise ConflictError("An account with that email already exists.") from None
    db.refresh(user)
    return user


def create_session(db: Session, user: User, *, user_agent: str | None = None) -> tuple[str, AuthSession]:
    settings = get_settings()
    token = generate_token()
    agent = (user_agent or "").strip()[:300] or None
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_token(token),
        user_agent=agent,
        expires_at=_now() + timedelta(hours=settings.auth_session_ttl_hours),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return token, session


def resolve_session(db: Session, token: str | None) -> User | None:
    """Return the active user for ``token``, or ``None`` if it is unusable."""
    if not token:
        return None
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is None or session.revoked_at is not None:
        return None
    if _as_aware(session.expires_at) <= _now():
        return None
    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        return None
    return user


def authenticate(db: Session, *, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    # Always run the (constant-time) password check so a missing account and a
    # wrong password are indistinguishable in timing.
    if not verify_password(password, user.password_hash if user else None):
        raise UnauthorizedError("Invalid email or password.")
    if not user or not user.is_active:
        raise UnauthorizedError("Invalid email or password.")
    return user


def revoke_session(db: Session, token: str | None) -> bool:
    if not token:
        return False
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    if session is None or session.revoked_at is not None:
        return False
    session.revoked_at = _now()
    db.commit()
    return True
