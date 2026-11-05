from __future__ import annotations

from app.db.models import OrganizationMembership

PERMISSIONS: dict[str, frozenset[str]] = {
    "workspace.delete": frozenset({"owner"}),
    "workspace.manage_members": frozenset({"owner", "admin"}),
    "workspace.manage_billing": frozenset({"owner"}),
    "workspace.manage_settings": frozenset({"owner", "admin"}),
    "workspace.transfer_ownership": frozenset({"owner"}),
    "integration.connect": frozenset({"owner", "admin", "member"}),
    "integration.disconnect": frozenset({"owner", "admin", "member"}),
    "investigation.create": frozenset({"owner", "admin", "member"}),
    "investigation.read": frozenset({"owner", "admin", "member", "viewer"}),
    "kubernetes.diagnose": frozenset({"owner", "admin", "member", "viewer"}),
}


def has_permission(member: OrganizationMembership, permission: str) -> bool:
    allowed_roles = PERMISSIONS.get(permission)
    return allowed_roles is not None and member.role in allowed_roles
