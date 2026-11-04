"""Single source of truth for workspace role permissions.

The matrix below is the only place role names are mapped to permissions.
Route handlers, dependencies, and services must call :func:`has_permission`
instead of comparing ``role`` strings themselves, so the policy can be
audited (and tested) in one place.
"""

from __future__ import annotations

from typing import Any

ROLES = ("owner", "admin", "member", "viewer")

PERMISSIONS: dict[str, set[str]] = {
    "workspace.delete": {"owner"},
    "workspace.manage_members": {"owner", "admin"},
    "workspace.manage_billing": {"owner"},
    "workspace.manage_settings": {"owner", "admin"},
    "workspace.transfer_ownership": {"owner"},
    "integration.connect": {"owner", "admin", "member"},
    "integration.disconnect": {"owner", "admin", "member"},
    "investigation.create": {"owner", "admin", "member"},
    "investigation.read": {"owner", "admin", "member", "viewer"},
    # Owners/admins see every investigation and audit event in the workspace;
    # members/viewers see only their own rows.
    "investigation.read_all": {"owner", "admin"},
    "kubernetes.diagnose": {"owner", "admin", "member", "viewer"},
    # Conversation scoping (used by the phase-5 router migration).
    "conversation.read": {"owner", "admin", "member", "viewer"},
    "conversation.create": {"owner", "admin", "member"},
    # Audit visibility and CSV export.
    "audit.read": {"owner", "admin", "member", "viewer"},
    "audit.export": {"owner", "admin", "member"},
    "audit.read_all": {"owner", "admin"},
    # Read-only Kubernetes access for viewers.
    "kubernetes.read": {"owner", "admin", "member", "viewer"},
    # Member directory visibility.
    "member.read": {"owner", "admin", "member", "viewer"},
    # Invite lifecycle (create/resend/cancel).
    "invite.manage": {"owner", "admin"},
}


def has_permission(member: Any, permission: str) -> bool:
    """Return whether ``member`` may perform ``permission``.

    ``member`` is either a role string or any object exposing a ``role``
    attribute (for example a ``WorkspaceMembership`` row). Unknown roles and
    unknown permissions are always denied.
    """
    role = member if isinstance(member, str) else getattr(member, "role", None)
    allowed = PERMISSIONS.get(permission)
    if allowed is None or role is None:
        return False
    return role in allowed
