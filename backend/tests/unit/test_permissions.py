from __future__ import annotations

import pytest

from app.auth.permissions import PERMISSIONS, has_permission
from app.db.models import OrganizationMembership

ROLES = ("owner", "admin", "member", "viewer")


@pytest.mark.parametrize(
    ("role", "permission", "expected"),
    [
        (role, permission, role in allowed_roles)
        for permission, allowed_roles in PERMISSIONS.items()
        for role in ROLES
    ],
)
def test_permission_matrix(role: str, permission: str, expected: bool) -> None:
    member = OrganizationMembership(role=role)

    assert has_permission(member, permission) is expected


def test_unknown_permission_is_denied() -> None:
    member = OrganizationMembership(role="owner")

    assert not has_permission(member, "unknown.permission")
