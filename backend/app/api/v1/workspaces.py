"""Workspace lifecycle, membership, and invite endpoints.

All product routes are workspace-scoped: the ``{workspace_slug}`` path
segment is resolved by ``workspace_from_path``, which returns an identical
404 for nonexistent workspaces and non-members. Role checks go through
``require_workspace_permission``; there are no role string comparisons here.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import (
    DbSession,
    RequiredUser,
    WorkspaceFromPath,
    require_workspace_permission,
)
from app.core.errors import AppError, NotFoundError
from app.schemas.workspace import (
    DeleteConfirmation,
    InviteAcceptResponse,
    InviteCreate,
    InviteOut,
    InvitesResponse,
    MemberAdd,
    MemberRoleUpdate,
    WorkspaceCreate,
    WorkspaceListResponse,
    WorkspaceMemberOut,
    WorkspaceMembersResponse,
    WorkspaceOut,
    WorkspaceUpdate,
)
from app.services import workspace_service
from app.services.audit import record_event

router = APIRouter(tags=["workspaces"])


def _workspace_out(workspace, role: str) -> WorkspaceOut:
    return WorkspaceOut(
        id=workspace.id,
        slug=workspace.slug,
        name=workspace.name,
        role=role,
        created_at=workspace.created_at,
    )


def _invite_out(invite) -> InviteOut:
    return InviteOut(
        id=invite.id,
        workspace_id=invite.workspace_id,
        email=invite.email,
        role=invite.role,
        expires_at=invite.expires_at,
        accepted_at=invite.accepted_at,
        created_at=invite.created_at,
    )


class InviteCreatedResponse(InviteOut):
    """An invite plus the raw single-use token, shown exactly once."""

    token: str


# ---- Workspaces (user-scoped) ----


@router.get("/workspaces", response_model=WorkspaceListResponse)
def list_workspaces(db: DbSession, user: RequiredUser) -> WorkspaceListResponse:
    rows = workspace_service.list_for_user(db, user_id=user.id)
    return WorkspaceListResponse(
        workspaces=[_workspace_out(workspace, role) for workspace, role in rows],
        total=len(rows),
    )


@router.post("/workspaces", response_model=WorkspaceOut, status_code=201)
def create_workspace(
    payload: WorkspaceCreate, db: DbSession, user: RequiredUser
) -> WorkspaceOut:
    workspace = workspace_service.create_workspace(db, user=user, name=payload.name)
    record_event(
        db,
        action="workspace.create",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=workspace.id,
        resource={"workspace_id": workspace.id, "slug": workspace.slug},
    )
    return _workspace_out(workspace, "owner")


@router.get("/workspaces/{workspace_slug}", response_model=WorkspaceOut)
def get_workspace(
    context: WorkspaceFromPath, user: RequiredUser
) -> WorkspaceOut:
    return _workspace_out(context.workspace, context.role)


@router.patch("/workspaces/{workspace_slug}", response_model=WorkspaceOut)
def update_workspace(
    payload: WorkspaceUpdate,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("workspace.manage_settings")),
) -> WorkspaceOut:
    workspace = workspace_service.update_workspace(
        db,
        workspace_id=context.workspace_id,
        name=payload.name,
        settings=payload.settings,
    )
    record_event(
        db,
        action="workspace.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"workspace_id": context.workspace_id},
        outcome={"name": workspace.name if workspace else None},
    )
    assert workspace is not None
    return _workspace_out(workspace, context.role)


@router.delete("/workspaces/{workspace_slug}", status_code=204)
def delete_workspace(
    payload: DeleteConfirmation,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _owner: None = Depends(require_workspace_permission("workspace.delete")),
) -> Response:
    if payload.confirm != context.workspace.slug:
        raise AppError(
            "Confirmation does not match the workspace slug.",
            status_code=400,
            details={"code": "confirmation_mismatch"},
        )
    record_event(
        db,
        action="workspace.delete",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"workspace_id": context.workspace_id, "slug": context.workspace.slug},
    )
    workspace_service.delete_workspace(db, workspace_id=context.workspace_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---- Members ----


@router.get(
    "/workspaces/{workspace_slug}/members", response_model=WorkspaceMembersResponse
)
def list_members(
    context: WorkspaceFromPath,
    db: DbSession,
    _read: None = Depends(require_workspace_permission("member.read")),
) -> WorkspaceMembersResponse:
    rows = workspace_service.members(db, workspace_id=context.workspace_id)
    return WorkspaceMembersResponse(
        members=[
            WorkspaceMemberOut(
                user_id=member.user_id,
                email=account.email,
                display_name=account.display_name,
                role=member.role,
                created_at=member.created_at,
            )
            for member, account in rows
        ],
        total=len(rows),
    )


@router.post(
    "/workspaces/{workspace_slug}/members",
    response_model=WorkspaceMemberOut,
    status_code=201,
)
def add_member(
    payload: MemberAdd,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("workspace.manage_members")),
) -> WorkspaceMemberOut:
    member, account = workspace_service.add_member_by_email(
        db, workspace_id=context.workspace_id, email=payload.email, role=payload.role
    )
    record_event(
        db,
        action="workspace.member.add",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"member_user_id": member.user_id},
        outcome={"role": member.role},
    )
    return WorkspaceMemberOut(
        user_id=member.user_id,
        email=account.email,
        display_name=account.display_name,
        role=member.role,
        created_at=member.created_at,
    )


@router.patch("/workspaces/{workspace_slug}/members/{user_id}", response_model=WorkspaceMemberOut)
def update_member(
    user_id: str,
    payload: MemberRoleUpdate,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("workspace.manage_members")),
) -> WorkspaceMemberOut:
    member = workspace_service.update_member_role(
        db, workspace_id=context.workspace_id, user_id=user_id, role=payload.role
    )
    record_event(
        db,
        action="workspace.member.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"member_user_id": user_id},
        outcome={"role": member.role},
    )
    return WorkspaceMemberOut(
        user_id=member.user_id,
        role=member.role,
        created_at=member.created_at,
    )


@router.delete(
    "/workspaces/{workspace_slug}/members/{user_id}", status_code=204
)
def remove_member(
    user_id: str,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("workspace.manage_members")),
) -> Response:
    removed = workspace_service.remove_member(
        db, workspace_id=context.workspace_id, user_id=user_id
    )
    if not removed:
        raise NotFoundError("Member not found.")
    record_event(
        db,
        action="workspace.member.remove",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"member_user_id": user_id},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---- Invites ----


@router.get(
    "/workspaces/{workspace_slug}/invites", response_model=InvitesResponse
)
def list_invites(
    context: WorkspaceFromPath,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("invite.manage")),
) -> InvitesResponse:
    invites = workspace_service.list_invites(db, workspace_id=context.workspace_id)
    return InvitesResponse(
        invites=[_invite_out(invite) for invite in invites], total=len(invites)
    )


@router.post(
    "/workspaces/{workspace_slug}/invites",
    response_model=InviteCreatedResponse,
    status_code=201,
)
def create_invite(
    payload: InviteCreate,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("invite.manage")),
) -> InviteCreatedResponse:
    invite, raw_token = workspace_service.create_invite(
        db,
        workspace_id=context.workspace_id,
        invited_by=user.id,
        email=payload.email,
        role=payload.role,
    )
    record_event(
        db,
        action="workspace.invite.create",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"invite_id": invite.id},
        outcome={"role": invite.role},
    )
    return InviteCreatedResponse(**_invite_out(invite).model_dump(), token=raw_token)


@router.post(
    "/workspaces/{workspace_slug}/invites/{invite_id}/resend",
    response_model=InviteCreatedResponse,
)
def resend_invite(
    invite_id: str,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("invite.manage")),
) -> InviteCreatedResponse:
    rotated = workspace_service.rotate_invite(
        db, workspace_id=context.workspace_id, invite_id=invite_id
    )
    if rotated is None:
        raise NotFoundError("Invite not found.")
    invite, raw_token = rotated
    record_event(
        db,
        action="workspace.invite.resend",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"invite_id": invite.id},
    )
    return InviteCreatedResponse(**_invite_out(invite).model_dump(), token=raw_token)


@router.delete(
    "/workspaces/{workspace_slug}/invites/{invite_id}", status_code=204
)
def cancel_invite(
    invite_id: str,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    _manage: None = Depends(require_workspace_permission("invite.manage")),
) -> Response:
    cancelled = workspace_service.cancel_invite(
        db, workspace_id=context.workspace_id, invite_id=invite_id
    )
    if not cancelled:
        raise NotFoundError("Invite not found.")
    record_event(
        db,
        action="workspace.invite.cancel",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=context.workspace_id,
        resource={"invite_id": invite_id},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/invites/{token}/accept", response_model=InviteAcceptResponse)
def accept_invite(
    token: str, db: DbSession, user: RequiredUser
) -> InviteAcceptResponse:
    workspace = workspace_service.accept_invite(db, token=token, user=user)
    record_event(
        db,
        action="workspace.invite.accept",
        actor="user",
        decision="allow",
        user_id=user.id,
        workspace_id=workspace.id,
        resource={"workspace_id": workspace.id},
    )
    membership = workspace_service.membership(
        db, workspace_id=workspace.id, user_id=user.id
    )
    role = membership.role if membership else "member"
    return InviteAcceptResponse(workspace=_workspace_out(workspace, role))
