"""Unit-level checks for admin tenant and lockout rules."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.core.errors import ConflictError
from app.db.models import Investigation, User
from app.schemas.admin import AdminUserUpdate
from app.services import admin as admin_service
from app.services.auth import ensure_bootstrap_admin


def test_last_active_admin_cannot_be_demoted(db_session) -> None:
    admin_user = User(
        email="last-admin-guard@example.com",
        password_hash="not-used",
        role="admin",
        tenant_id="guard-tenant",
    )
    db_session.add(admin_user)
    db_session.commit()

    others = list(
        db_session.scalars(
            select(User).where(
                User.role == "admin", User.id != admin_user.id
            )
        )
    )
    previous_roles = {user.id: user.role for user in others}
    for user in others:
        user.role = "member"
    db_session.commit()

    try:
        with pytest.raises(ConflictError):
            admin_service.update_user(
                db_session,
                admin_user,
                admin_user.id,
                AdminUserUpdate(role="member"),
            )
        with pytest.raises(ConflictError):
            admin_service.update_user(
                db_session,
                admin_user,
                admin_user.id,
                AdminUserUpdate(is_active=False),
            )
    finally:
        for user in others:
            user.role = previous_roles[user.id]
        db_session.commit()

    db_session.refresh(admin_user)
    assert admin_user.role == "admin"
    assert admin_user.is_active is True


def test_moving_a_member_tenant_migrates_their_investigations(db_session) -> None:
    admin_user = User(
        email="tenant-move-admin@example.com",
        password_hash="not-used",
        role="admin",
        tenant_id="tenant-admin",
    )
    member = User(
        email="tenant-move-member@example.com",
        password_hash="not-used",
        role="member",
        tenant_id="tenant-old",
    )
    db_session.add_all([admin_user, member])
    db_session.commit()

    investigation = Investigation(
        user_id=member.id,
        tenant_id="tenant-old",
        title="Move me",
        kind="kubernetes",
        status="open",
    )
    db_session.add(investigation)
    db_session.commit()

    updated = admin_service.update_user(
        db_session,
        admin_user,
        member.id,
        AdminUserUpdate(tenant_id="tenant-new"),
    )

    assert updated.tenant_id == "tenant-new"
    db_session.refresh(investigation)
    assert investigation.tenant_id == "tenant-new"

def test_bootstrap_email_promotes_an_existing_member(db_session) -> None:
    settings = get_settings()
    previous = settings.bootstrap_admin_email
    member = User(
        email="bootstrap-promote@example.com",
        password_hash="not-used",
        role="member",
        tenant_id="bootstrap-tenant",
    )
    db_session.add(member)
    db_session.commit()

    settings.bootstrap_admin_email = member.email
    try:
        promoted = ensure_bootstrap_admin(db_session)
        assert promoted is not None
        assert promoted.id == member.id
        assert promoted.role == "admin"
    finally:
        settings.bootstrap_admin_email = previous
        member.role = "member"
        db_session.add(member)
        db_session.commit()
