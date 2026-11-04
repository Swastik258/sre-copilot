"""Workspace lifecycle: creation, membership, invites, and hard deletion.

This service is the only writer for the ``workspaces``,
``workspace_members``, and ``workspace_invites`` tables. Slugs are derived
from the user's name or email local part with a numeric suffix on collision;
no fixed names like "default" or "personal" appear here.
"""

from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.db.models import User, Workspace, WorkspaceInvite, WorkspaceMembership
from app.security.tokens import generate_token, hash_token

_INVITE_TTL_HOURS = 168


def _now() -> datetime:
    return datetime.now(UTC)


def _uuid() -> str:
    return str(uuid.uuid4())


def _slug_base(display_name: str | None, email: str | None) -> str:
    raw = display_name if display_name else (email.split("@", 1)[0] if email else None)
    slug = re.sub(r"[^a-z0-9]+", "-", (raw or "user").lower()).strip("-")
    return slug or "user"


def _unique_slug(db: Session, base: str) -> str:
    existing = set(db.scalars(select(Workspace.slug)).all())
    if base not in existing:
        return base
    counter = 2
    while f"{base}-{counter}" in existing:
        counter += 1
    return f"{base}-{counter}"


def _insert_workspace(db: Session, *, slug: str, name: str) -> Workspace:
    workspace = Workspace(slug=slug, name=name, settings={})
    db.add(workspace)
    db.flush()
    return workspace


def create_personal_workspace(
    db: Session, *, user: User, commit: bool = True
) -> Workspace:
    """Create the personal workspace a user owns; used by signup.

    With ``commit=False`` the rows are only flushed so the caller can commit
    them inside its own transaction.
    """
    slug = _unique_slug(db, _slug_base(user.display_name, user.email))
    workspace = _insert_workspace(
        db, slug=slug, name=user.display_name or user.email or f"Workspace {slug}"
    )
    db.add(
        WorkspaceMembership(
            workspace_id=workspace.id, user_id=user.id, role="owner"
        )
    )
    if commit:
        db.commit()
    db.refresh(workspace)
    return workspace


def create_workspace(db: Session, *, user: User, name: str) -> Workspace:
    """Create a new workspace with ``user`` as its owner."""
    base = _slug_base(name, None)
    if base in {"new", "workspace"}:
        base = f"{base}-ws"
    slug = _unique_slug(db, base)
    workspace = _insert_workspace(db, slug=slug, name=name)
    db.add(
        WorkspaceMembership(
            workspace_id=workspace.id, user_id=user.id, role="owner"
        )
    )
    db.commit()
    db.refresh(workspace)
    return workspace


def get_by_slug(db: Session, slug: str) -> Workspace | None:
    return db.scalar(select(Workspace).where(Workspace.slug == slug))


def get_for_user_by_slug(
    db: Session, *, slug: str, user_id: str
) -> Workspace | None:
    return db.scalar(
        select(Workspace)
        .join(WorkspaceMembership, WorkspaceMembership.workspace_id == Workspace.id)
        .where(Workspace.slug == slug, WorkspaceMembership.user_id == user_id)
    )


def list_for_user(db: Session, *, user_id: str) -> list[tuple[Workspace, str]]:
    rows = db.execute(
        select(Workspace, WorkspaceMembership.role)
        .join(WorkspaceMembership, WorkspaceMembership.workspace_id == Workspace.id)
        .where(WorkspaceMembership.user_id == user_id)
        .order_by(Workspace.created_at)
    ).all()
    return [(workspace, role) for workspace, role in rows]


def primary_workspace(db: Session, *, user_id: str) -> Workspace | None:
    """The user's oldest membership; the fallback for account-level events."""
    return db.scalar(
        select(Workspace)
        .join(WorkspaceMembership, WorkspaceMembership.workspace_id == Workspace.id)
        .where(WorkspaceMembership.user_id == user_id)
        .order_by(WorkspaceMembership.created_at)
    )


def membership(
    db: Session, *, workspace_id: str, user_id: str
) -> WorkspaceMembership | None:
    return db.scalar(
        select(WorkspaceMembership).where(
            WorkspaceMembership.workspace_id == workspace_id,
            WorkspaceMembership.user_id == user_id,
        )
    )


def members(db: Session, *, workspace_id: str) -> list[tuple[WorkspaceMembership, User]]:
    rows = db.execute(
        select(WorkspaceMembership, User)
        .join(User, User.id == WorkspaceMembership.user_id)
        .where(WorkspaceMembership.workspace_id == workspace_id)
        .order_by(WorkspaceMembership.created_at)
    ).all()
    return list(rows)


def _guard_last_privileged(
    db: Session, *, workspace_id: str, target_user_id: str, target_role: str
) -> None:
    """Refuse to remove or demote the last owner (or owner-less last admin)."""
    others = list(
        db.scalars(
            select(WorkspaceMembership).where(
                WorkspaceMembership.workspace_id == workspace_id,
                WorkspaceMembership.user_id != target_user_id,
            )
        )
    )
    if target_role == "owner" and not any(m.role == "owner" for m in others):
        raise ConflictError("The last owner cannot be removed or demoted.")
    if (
        target_role == "admin"
        and not any(m.role in {"owner", "admin"} for m in others)
    ):
        raise ConflictError("The last admin cannot be removed or demoted.")


def update_member_role(
    db: Session, *, workspace_id: str, user_id: str, role: str
) -> WorkspaceMembership:
    row = membership(db, workspace_id=workspace_id, user_id=user_id)
    if row is None:
        raise NotFoundError("Member not found.")
    if row.role == role:
        return row
    _guard_last_privileged(
        db,
        workspace_id=workspace_id,
        target_user_id=user_id,
        target_role=row.role,
    )
    row.role = role
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def add_member_by_email(
    db: Session, *, workspace_id: str, email: str, role: str
) -> tuple[WorkspaceMembership, User]:
    """Add an existing account to a workspace directly (no invite)."""
    user = db.scalar(select(User).where(User.email == email.strip().lower()))
    if user is None:
        raise NotFoundError("No account with that email exists.")
    if membership(db, workspace_id=workspace_id, user_id=user.id) is not None:
        raise ConflictError("That account is already a member of this workspace.")
    row = WorkspaceMembership(
        workspace_id=workspace_id, user_id=user.id, role=role
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row, user


def remove_member(db: Session, *, workspace_id: str, user_id: str) -> bool:    row = membership(db, workspace_id=workspace_id, user_id=user_id)
    if row is None:
        return False
    _guard_last_privileged(
        db,
        workspace_id=workspace_id,
        target_user_id=user_id,
        target_role=row.role,
    )
    db.delete(row)
    db.commit()
    return True


def update_workspace(
    db: Session,
    *,
    workspace_id: str,
    name: str | None = None,
    settings: dict | None = None,
) -> Workspace | None:
    workspace = db.get(Workspace, workspace_id)
    if workspace is None:
        return None
    if name is not None:
        workspace.name = name
    if settings is not None:
        workspace.settings = settings
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


def delete_workspace(db: Session, *, workspace_id: str) -> bool:
    """Hard-delete a workspace and (via FK CASCADE) every row it owns."""
    workspace = db.get(Workspace, workspace_id)
    if workspace is None:
        return False
    db.delete(workspace)
    db.commit()
    return True


def create_invite(
    db: Session,
    *,
    workspace_id: str,
    invited_by: str,
    email: str,
    role: str,
    ttl_hours: int = _INVITE_TTL_HOURS,
) -> tuple[WorkspaceInvite, str]:
    """Create an invite; returns the row and the raw single-use token."""
    raw_token = generate_token()
    invite = WorkspaceInvite(
        workspace_id=workspace_id,
        email=email.strip().lower(),
        role=role,
        token_hash=hash_token(raw_token),
        invited_by=invited_by,
        expires_at=_now() + timedelta(hours=ttl_hours),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite, raw_token


def list_invites(
    db: Session, *, workspace_id: str, include_accepted: bool = False
) -> list[WorkspaceInvite]:
    filters = [WorkspaceInvite.workspace_id == workspace_id]
    if not include_accepted:
        filters.append(WorkspaceInvite.accepted_at.is_(None))
    return list(
        db.scalars(
            select(WorkspaceInvite)
            .where(*filters)
            .order_by(WorkspaceInvite.created_at.desc())
        )
    )


def rotate_invite(
    db: Session, *, workspace_id: str, invite_id: str
) -> tuple[WorkspaceInvite, str] | None:
    """Issue a fresh token for a pending invite (the resend flow)."""
    invite = db.scalar(
        select(WorkspaceInvite).where(
            WorkspaceInvite.id == invite_id,
            WorkspaceInvite.workspace_id == workspace_id,
        )
    )
    if invite is None or invite.accepted_at is not None:
        return None
    raw_token = generate_token()
    invite.token_hash = hash_token(raw_token)
    invite.expires_at = _now() + timedelta(hours=_INVITE_TTL_HOURS)
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite, raw_token


def cancel_invite(db: Session, *, workspace_id: str, invite_id: str) -> bool:
    invite = db.scalar(
        select(WorkspaceInvite).where(
            WorkspaceInvite.id == invite_id,
            WorkspaceInvite.workspace_id == workspace_id,
        )
    )
    if invite is None or invite.accepted_at is not None:
        return False
    db.delete(invite)
    db.commit()
    return True


def accept_invite(db: Session, *, token: str, user: User) -> Workspace:
    """Accept an invite by raw token.

    Unknown, used, and expired tokens raise the identical 404 so token state
    is not leaked. Only the authenticated user whose email matches may
    accept.
    """
    invite = db.scalar(
        select(WorkspaceInvite).where(WorkspaceInvite.token_hash == hash_token(token))
    )
    if (
        invite is None
        or invite.accepted_at is not None
        or invite.expires_at < _now()
    ):
        raise NotFoundError("Invite not found or expired.")
    if (user.email or "").strip().lower() != invite.email:
        raise ForbiddenError(
            "This invite was issued to a different email address."
        )
    if membership(db, workspace_id=invite.workspace_id, user_id=user.id) is None:
        db.add(
            WorkspaceMembership(
                workspace_id=invite.workspace_id, user_id=user.id, role=invite.role
            )
        )
    invite.accepted_at = _now()
    db.add(invite)
    db.commit()
    workspace = db.get(Workspace, invite.workspace_id)
    assert workspace is not None  # FK guarantees the workspace exists
    return workspace


def pending_invite_count(db: Session, *, workspace_id: str) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(WorkspaceInvite)
            .where(
                WorkspaceInvite.workspace_id == workspace_id,
                WorkspaceInvite.accepted_at.is_(None),
            )
        )
        or 0
    )
