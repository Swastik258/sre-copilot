"""Admin-only user and tenant management endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import AdminUser, DbSession, Pagination
from app.schemas.admin import (
    AdminUserListResponse,
    AdminUserUpdate,
    TenantListResponse,
)
from app.schemas.auth import UserOut
from app.services import admin as service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=AdminUserListResponse)
def list_users(
    db: DbSession,
    admin: AdminUser,
    pagination: Pagination,
    tenant_id: Annotated[str | None, Query(max_length=36)] = None,
) -> AdminUserListResponse:
    return service.list_users(
        db,
        admin,
        tenant_id=tenant_id,
        limit=pagination.page_size,
        offset=(pagination.page - 1) * pagination.page_size,
    )


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: DbSession,
    admin: AdminUser,
) -> UserOut:
    return service.update_user(db, admin, user_id, payload)


@router.get("/tenants", response_model=TenantListResponse)
def list_tenants(db: DbSession, admin: AdminUser) -> TenantListResponse:
    return service.list_tenants(db, admin)
