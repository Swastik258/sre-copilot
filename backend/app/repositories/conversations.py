"""Workspace-scoped access to conversations and their messages.

Messages carry a denormalized ``workspace_id`` kept consistent with the
parent conversation; every write goes through :func:`add_message` so the two
can never drift.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Conversation, Message


def list_for_workspace(
    db: Session,
    *,
    workspace_id: str,
    user_id: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Conversation], int]:
    filters = [Conversation.workspace_id == workspace_id]
    if user_id is not None:
        filters.append(Conversation.user_id == user_id)
    total = (
        db.scalar(select(func.count()).select_from(Conversation).where(*filters)) or 0
    )
    rows = list(
        db.scalars(
            select(Conversation)
            .where(*filters)
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    return rows, total


def get_for_workspace(
    db: Session, *, workspace_id: str, conversation_id: str
) -> Conversation | None:
    return db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.workspace_id == workspace_id,
        )
    )


def create(
    db: Session, *, workspace_id: str, user_id: str, title: str = "New conversation"
) -> Conversation:
    row = Conversation(user_id=user_id, workspace_id=workspace_id, title=title)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def rename(
    db: Session, *, workspace_id: str, conversation_id: str, title: str
) -> Conversation | None:
    row = get_for_workspace(db, workspace_id=workspace_id, conversation_id=conversation_id)
    if row is None:
        return None
    row.title = title
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete(db: Session, *, workspace_id: str, conversation_id: str) -> bool:
    row = get_for_workspace(db, workspace_id=workspace_id, conversation_id=conversation_id)
    if row is None:
        return False
    db.delete(row)
    db.commit()
    return True


def messages_for_conversation(
    db: Session, *, workspace_id: str, conversation_id: str
) -> list[Message]:
    if (
        get_for_workspace(db, workspace_id=workspace_id, conversation_id=conversation_id)
        is None
    ):
        return []
    return list(
        db.scalars(
            select(Message)
            .where(
                Message.workspace_id == workspace_id,
                Message.conversation_id == conversation_id,
            )
            .order_by(Message.created_at)
        )
    )


def add_message(
    db: Session,
    *,
    workspace_id: str,
    conversation_id: str,
    role: str,
    content: str,
    structured: dict[str, Any] | None = None,
) -> Message | None:
    conversation = get_for_workspace(
        db, workspace_id=workspace_id, conversation_id=conversation_id
    )
    if conversation is None:
        return None
    row = Message(
        conversation_id=conversation.id,
        workspace_id=workspace_id,
        role=role,
        content=content,
        structured=structured,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
