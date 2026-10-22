"""Organization/workspace lifecycle and membership endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Response, status

from app.api.deps import DbSession, RequiredUser
from app.schemas.auth import UserOut
from app.schemas.organization import (
    MemberAdd,
    MemberUpdate,
    OrganizationCreate,
    OrganizationListResponse,
    OrganizationOut,
    OrganizationUpdate,
    OrgMemberOut,
    OrgMembersResponse,
)
from app.services import organizations as service
from app.services.audit import record_event

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("", response_model=OrganizationListResponse)
def list_organizations(db: DbSession, user: RequiredUser) -> OrganizationListResponse:
    return service.list_organizations(db, user)


@router.post("", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate, db: DbSession, user: RequiredUser
) -> OrganizationOut:
    org = service.create_organization(db, user, payload)
    record_event(
        db,
        action="organization.create",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=org.id,
        resource={"organization_id": org.id, "name": org.name},
    )
    return org


@router.get("/{organization_id}", response_model=OrganizationOut)
def get_organization(
    organization_id: str, db: DbSession, user: RequiredUser
) -> OrganizationOut:
    return service.get_organization(db, user, organization_id)


@router.patch("/{organization_id}", response_model=OrganizationOut)
def update_organization(
    organization_id: str,
    payload: OrganizationUpdate,
    db: DbSession,
    user: RequiredUser,
) -> OrganizationOut:
    org = service.update_organization(db, user, organization_id, payload)
    record_event(
        db,
        action="organization.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=organization_id,
        resource={"organization_id": organization_id},
        outcome={"name": org.name},
    )
    return org


@router.get("/{organization_id}/members", response_model=OrgMembersResponse)
def list_members(
    organization_id: str, db: DbSession, user: RequiredUser
) -> OrgMembersResponse:
    return service.list_members(db, user, organization_id)


@router.post(
    "/{organization_id}/members",
    response_model=OrgMemberOut,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    organization_id: str,
    payload: MemberAdd,
    db: DbSession,
    user: RequiredUser,
) -> OrgMemberOut:
    member = service.add_member(db, user, organization_id, payload)
    record_event(
        db,
        action="organization.member.add",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=organization_id,
        resource={"organization_id": organization_id, "user_id": member.user_id},
        outcome={"role": member.role},
    )
    return member


@router.patch("/{organization_id}/members/{user_id}", response_model=OrgMemberOut)
def update_member(
    organization_id: str,
    user_id: str,
    payload: MemberUpdate,
    db: DbSession,
    user: RequiredUser,
) -> OrgMemberOut:
    member = service.update_member(db, user, organization_id, user_id, payload)
    record_event(
        db,
        action="organization.member.update",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=organization_id,
        resource={"organization_id": organization_id, "user_id": user_id},
        outcome={"role": member.role},
    )
    return member


@router.delete(
    "/{organization_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member(
    organization_id: str, user_id: str, db: DbSession, user: RequiredUser
) -> Response:
    service.remove_member(db, user, organization_id, user_id)
    record_event(
        db,
        action="organization.member.remove",
        actor="user",
        decision="allow",
        user_id=user.id,
        tenant_id=organization_id,
        resource={"organization_id": organization_id, "user_id": user_id},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{organization_id}/switch", response_model=UserOut)
def switch_organization(
    organization_id: str, db: DbSession, user: RequiredUser
) -> UserOut:
    updated = service.switch_organization(db, user, organization_id)
    record_event(
        db,
        action="organization.switch",
        actor="user",
        decision="allow",
        user_id=updated.id,
        tenant_id=updated.tenant_id,
    )
    return UserOut.model_validate(updated)
