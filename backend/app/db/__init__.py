"""Database package.

Re-exports Base, SessionLocal, get_db, and every model so callers can do:

    from app.db import Base, SessionLocal, User, Conversation

instead of reaching into submodules.
"""

from app.db.base import Base
from app.db.models import (
    AppSetting,
    AuditEvent,
    Conversation,
    Evidence,
    Integration,
    Investigation,
    Message,
    User,
    Workspace,
    WorkspaceInvite,
    WorkspaceMembership,
)
from app.db.session import SessionLocal, engine, get_db

__all__ = [
    "Base",
    "SessionLocal",
    "engine",
    "get_db",
    "User",
    "Conversation",
    "Message",
    "Integration",
    "AppSetting",
    "Investigation",
    "AuditEvent",
    "Evidence",
    "Workspace",
    "WorkspaceMembership",
    "WorkspaceInvite",
]
