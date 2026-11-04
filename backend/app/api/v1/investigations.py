"""Persisted investigations and assistant chat.

Scoped routes live under ``/workspaces/{workspace_slug}/investigations`` and
are the canonical surface. The legacy unprefixed routes keep working only
when the workspace resolves from the ``X-Workspace-Id`` header or the user's
single workspace, and log a deprecation warning. Members and viewers see
their own investigations; owners and admins see all in the workspace.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    DbSession,
    Pagination,
    RequiredUser,
    WorkspaceFromPath,
    WorkspaceFromRequest,
    require_workspace_permission,
)
from app.auth.permissions import has_permission
from app.schemas.evidence import Evidence
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationDetail,
    InvestigationKind,
    InvestigationListResponse,
    InvestigationMessagesResponse,
    InvestigationStatus,
    MessageCreate,
    MessageExchange,
)
from app.services import investigations as service

log = logging.getLogger("app")

_DEPRECATION = (
    "Unprefixed /investigations routes are deprecated; use "
    "/api/v1/workspaces/{workspace_slug}/investigations."
)

router = APIRouter(prefix="/investigations", tags=["investigations"])
scoped_router = APIRouter(
    prefix="/workspaces/{workspace_slug}/investigations", tags=["investigations"]
)


@scoped_router.post(
    "",
    response_model=InvestigationDetail,
    status_code=201,
    dependencies=[Depends(require_workspace_permission("investigation.create"))],
)
def create_investigation_scoped(
    payload: InvestigationCreate,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
) -> InvestigationDetail:
    return service.create_investigation(
        db, workspace_id=context.workspace_id, user=user, payload=payload
    )


@scoped_router.get(
    "",
    response_model=InvestigationListResponse,
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def list_investigations_scoped(
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
    pagination: Pagination,
    status: Annotated[InvestigationStatus | None, Query()] = None,
    kind: Annotated[InvestigationKind | None, Query()] = None,
) -> InvestigationListResponse:
    return service.list_investigations(
        db,
        workspace_id=context.workspace_id,
        user=user,
        can_read_all=has_permission(context.role, "investigation.read_all"),
        status=status,
        kind=kind,
        limit=pagination.page_size,
        offset=(pagination.page - 1) * pagination.page_size,
    )


@scoped_router.get(
    "/{investigation_id}",
    response_model=InvestigationDetail,
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def get_investigation_scoped(
    investigation_id: str,
    context: WorkspaceFromPath,
    db: DbSession,
) -> InvestigationDetail:
    investigation = service.get_investigation(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )
    return service._to_detail(
        db, workspace_id=context.workspace_id, investigation=investigation
    )


@scoped_router.get(
    "/{investigation_id}/messages",
    response_model=InvestigationMessagesResponse,
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def get_messages_scoped(
    investigation_id: str,
    context: WorkspaceFromPath,
    db: DbSession,
) -> InvestigationMessagesResponse:
    return service.get_messages(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )


@scoped_router.post(
    "/{investigation_id}/messages",
    response_model=MessageExchange,
    dependencies=[Depends(require_workspace_permission("investigation.create"))],
)
def add_message_scoped(
    investigation_id: str,
    payload: MessageCreate,
    context: WorkspaceFromPath,
    user: RequiredUser,
    db: DbSession,
) -> MessageExchange:
    return service.add_message(
        db,
        workspace_id=context.workspace_id,
        user=user,
        investigation_id=investigation_id,
        content=payload.content,
    )


@scoped_router.get(
    "/{investigation_id}/evidence",
    response_model=list[Evidence],
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def get_evidence_scoped(
    investigation_id: str,
    context: WorkspaceFromPath,
    db: DbSession,
) -> list[Evidence]:
    service.get_investigation(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )
    return service._db_evidence(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )


@scoped_router.post(
    "/{investigation_id}/close",
    response_model=InvestigationDetail,
    dependencies=[Depends(require_workspace_permission("investigation.create"))],
)
def close_investigation_scoped(
    investigation_id: str,
    context: WorkspaceFromPath,
    db: DbSession,
) -> InvestigationDetail:
    return service.close_investigation(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )


# ---- Legacy unprefixed routes (deprecated) ----


@router.post(
    "",
    response_model=InvestigationDetail,
    status_code=201,
    dependencies=[Depends(require_workspace_permission("investigation.create"))],
)
def create_investigation(
    payload: InvestigationCreate,
    context: WorkspaceFromRequest,
    user: RequiredUser,
    db: DbSession,
) -> InvestigationDetail:
    log.warning(_DEPRECATION)
    return service.create_investigation(
        db, workspace_id=context.workspace_id, user=user, payload=payload
    )


@router.get(
    "",
    response_model=InvestigationListResponse,
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def list_investigations(
    context: WorkspaceFromRequest,
    user: RequiredUser,
    db: DbSession,
    pagination: Pagination,
    status: Annotated[InvestigationStatus | None, Query()] = None,
    kind: Annotated[InvestigationKind | None, Query()] = None,
) -> InvestigationListResponse:
    log.warning(_DEPRECATION)
    return service.list_investigations(
        db,
        workspace_id=context.workspace_id,
        user=user,
        can_read_all=has_permission(context.role, "investigation.read_all"),
        status=status,
        kind=kind,
        limit=pagination.page_size,
        offset=(pagination.page - 1) * pagination.page_size,
    )


@router.get(
    "/{investigation_id}",
    response_model=InvestigationDetail,
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def get_investigation(
    investigation_id: str,
    context: WorkspaceFromRequest,
    db: DbSession,
) -> InvestigationDetail:
    log.warning(_DEPRECATION)
    investigation = service.get_investigation(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )
    return service._to_detail(
        db, workspace_id=context.workspace_id, investigation=investigation
    )


@router.get(
    "/{investigation_id}/messages",
    response_model=InvestigationMessagesResponse,
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def get_messages(
    investigation_id: str,
    context: WorkspaceFromRequest,
    db: DbSession,
) -> InvestigationMessagesResponse:
    log.warning(_DEPRECATION)
    return service.get_messages(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )


@router.post(
    "/{investigation_id}/messages",
    response_model=MessageExchange,
    dependencies=[Depends(require_workspace_permission("investigation.create"))],
)
def add_message(
    investigation_id: str,
    payload: MessageCreate,
    context: WorkspaceFromRequest,
    user: RequiredUser,
    db: DbSession,
) -> MessageExchange:
    log.warning(_DEPRECATION)
    return service.add_message(
        db,
        workspace_id=context.workspace_id,
        user=user,
        investigation_id=investigation_id,
        content=payload.content,
    )


@router.get(
    "/{investigation_id}/evidence",
    response_model=list[Evidence],
    dependencies=[Depends(require_workspace_permission("investigation.read"))],
)
def get_evidence(
    investigation_id: str,
    context: WorkspaceFromRequest,
    db: DbSession,
) -> list[Evidence]:
    log.warning(_DEPRECATION)
    service.get_investigation(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )
    return service._db_evidence(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )


@router.post(
    "/{investigation_id}/close",
    response_model=InvestigationDetail,
    dependencies=[Depends(require_workspace_permission("investigation.create"))],
)
def close_investigation(
    investigation_id: str,
    context: WorkspaceFromRequest,
    db: DbSession,
) -> InvestigationDetail:
    log.warning(_DEPRECATION)
    return service.close_investigation(
        db, workspace_id=context.workspace_id, investigation_id=investigation_id
    )
