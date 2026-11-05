from __future__ import annotations

import uuid

import pytest
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.api.workspace import get_current_workspace
from app.core.errors import AppError, NotFoundError
from app.db.models import Organization, OrganizationMembership, User


def _request(
    *,
    path_params: dict[str, str] | None = None,
    headers: dict[str, str] | None = None,
) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": [
                (name.lower().encode(), value.encode())
                for name, value in (headers or {}).items()
            ],
            "path_params": path_params or {},
        }
    )


def _add_membership(
    db: Session,
    user: User,
    *,
    slug: str,
    role: str = "member",
) -> Organization:
    workspace = Organization(
        id=str(uuid.uuid4()),
        name=f"Workspace {slug}",
        slug=slug,
        created_by=user.id,
    )
    db.add(workspace)
    db.flush()
    db.add(
        OrganizationMembership(
            organization_id=workspace.id,
            user_id=user.id,
            role=role,
        )
    )
    db.flush()
    return workspace


def _user(db: Session) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email=f"{uuid.uuid4()}@example.com",
        role="member",
        tenant_id=str(uuid.uuid4()),
    )
    db.add(user)
    db.flush()
    return user


def test_url_slug_takes_precedence_over_workspace_header(db_session: Session) -> None:
    user = _user(db_session)
    from_url = _add_membership(db_session, user, slug=f"url-{uuid.uuid4().hex}")
    from_header = _add_membership(db_session, user, slug=f"header-{uuid.uuid4().hex}")

    member = get_current_workspace(
        _request(
            path_params={"slug": from_url.slug or ""},
            headers={"X-Workspace-Id": from_header.id},
        ),
        db_session,
        user,
    )

    assert member.organization_id == from_url.id


def test_workspace_header_selects_a_member_workspace(db_session: Session) -> None:
    user = _user(db_session)
    workspace = _add_membership(db_session, user, slug=f"header-{uuid.uuid4().hex}")

    member = get_current_workspace(
        _request(headers={"X-Workspace-Id": workspace.id}),
        db_session,
        user,
    )

    assert member.organization_id == workspace.id


def test_single_membership_is_selected_without_request_workspace(db_session: Session) -> None:
    user = _user(db_session)
    workspace = _add_membership(db_session, user, slug=f"only-{uuid.uuid4().hex}")

    member = get_current_workspace(_request(), db_session, user)

    assert member.organization_id == workspace.id


def test_multiple_memberships_require_explicit_selection(db_session: Session) -> None:
    user = _user(db_session)
    _add_membership(db_session, user, slug=f"first-{uuid.uuid4().hex}")
    _add_membership(db_session, user, slug=f"second-{uuid.uuid4().hex}")

    with pytest.raises(AppError) as raised:
        get_current_workspace(_request(), db_session, user)

    assert raised.value.status_code == 400
    assert raised.value.code == "workspace_not_selected"


def test_nonmember_and_missing_workspace_have_identical_not_found_errors(
    db_session: Session,
) -> None:
    user = _user(db_session)
    other = _user(db_session)
    private_workspace = _add_membership(
        db_session,
        other,
        slug=f"private-{uuid.uuid4().hex}",
    )

    with pytest.raises(NotFoundError) as nonmember:
        get_current_workspace(
            _request(path_params={"slug": private_workspace.slug or ""}),
            db_session,
            user,
        )
    with pytest.raises(NotFoundError) as missing:
        get_current_workspace(
            _request(path_params={"slug": f"missing-{uuid.uuid4().hex}"}),
            db_session,
            user,
        )

    assert (
        nonmember.value.status_code,
        nonmember.value.code,
        nonmember.value.message,
    ) == (
        missing.value.status_code,
        missing.value.code,
        missing.value.message,
    )
