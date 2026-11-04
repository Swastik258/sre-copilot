"""The workspace permission matrix, role by role and permission by permission."""

from __future__ import annotations

import pytest

from app.auth.permissions import PERMISSIONS, ROLES, has_permission

EXPECTED = {
    "workspace.delete": {"owner"},
    "workspace.manage_members": {"owner", "admin"},
    "workspace.manage_billing": {"owner"},
    "workspace.manage_settings": {"owner", "admin"},
    "workspace.transfer_ownership": {"owner"},
    "integration.connect": {"owner", "admin", "member"},
    "integration.disconnect": {"owner", "admin", "member"},
    "investigation.create": {"owner", "admin", "member"},
    "investigation.read": {"owner", "admin", "member", "viewer"},
    "investigation.read_all": {"owner", "admin"},
    "kubernetes.diagnose": {"owner", "admin", "member", "viewer"},
    "conversation.read": {"owner", "admin", "member", "viewer"},
    "conversation.create": {"owner", "admin", "member"},
    "audit.read": {"owner", "admin", "member", "viewer"},
    "audit.export": {"owner", "admin", "member"},
    "audit.read_all": {"owner", "admin"},
    "kubernetes.read": {"owner", "admin", "member", "viewer"},
    "member.read": {"owner", "admin", "member", "viewer"},
    "invite.manage": {"owner", "admin"},
}


def test_matrix_matches_the_spec():
    assert PERMISSIONS == EXPECTED


@pytest.mark.parametrize("permission", sorted(EXPECTED))
@pytest.mark.parametrize("role", ROLES)
def test_every_role_permission_pair(role: str, permission: str):
    assert has_permission(role, permission) == (role in EXPECTED[permission])


def test_unknown_permission_is_denied():
    assert has_permission("owner", "workspace.nope") is False


def test_unknown_role_is_denied():
    assert has_permission("superuser", "investigation.read") is False


def test_membership_object_resolves_its_role():
    class Membership:
        role = "viewer"

    assert has_permission(Membership(), "investigation.read") is True
    assert has_permission(Membership(), "investigation.create") is False
