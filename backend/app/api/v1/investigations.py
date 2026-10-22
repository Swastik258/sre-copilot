"""Persisted investigations and assistant chat.

Members see their own investigations within their tenant; admins may inspect
across tenants. Messages are stored with the investigation, and evidence is
attached through the shared evidence table.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbSession, OperatorUser, Pagination, RequiredUser
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

router = APIRouter(prefix="/investigations", tags=["investigations"])


@router.post("", response_model=InvestigationDetail, status_code=201)
def create_investigation(
    payload: InvestigationCreate,
    db: DbSession,
    user: OperatorUser,
) -> InvestigationDetail:
    return service.create_investigation(db, user, payload)


@router.get("", response_model=InvestigationListResponse)
def list_investigations(
    db: DbSession,
    user: RequiredUser,
    pagination: Pagination,
    status: Annotated[InvestigationStatus | None, Query()] = None,
    kind: Annotated[InvestigationKind | None, Query()] = None,
) -> InvestigationListResponse:
    return service.list_investigations(
        db,
        user,
        status=status,
        kind=kind,
        limit=pagination.page_size,
        offset=(pagination.page - 1) * pagination.page_size,
    )


@router.get("/{investigation_id}", response_model=InvestigationDetail)
def get_investigation(
    investigation_id: str,
    db: DbSession,
    user: RequiredUser,
) -> InvestigationDetail:
    investigation = service.get_investigation(db, user, investigation_id)
    return service._to_detail(db, investigation)


@router.get("/{investigation_id}/messages", response_model=InvestigationMessagesResponse)
def get_messages(
    investigation_id: str,
    db: DbSession,
    user: RequiredUser,
) -> InvestigationMessagesResponse:
    return service.get_messages(db, user, investigation_id)


@router.post("/{investigation_id}/messages", response_model=MessageExchange)
def add_message(
    investigation_id: str,
    payload: MessageCreate,
    db: DbSession,
    user: OperatorUser,
) -> MessageExchange:
    return service.add_message(db, user, investigation_id, payload.content)


@router.get("/{investigation_id}/evidence", response_model=list[Evidence])
def get_evidence(
    investigation_id: str,
    db: DbSession,
    user: RequiredUser,
) -> list[Evidence]:
    service.get_investigation(db, user, investigation_id)
    return service._db_evidence(db, investigation_id)


@router.post("/{investigation_id}/close", response_model=InvestigationDetail)
def close_investigation(
    investigation_id: str,
    db: DbSession,
    user: OperatorUser,
) -> InvestigationDetail:
    return service.close_investigation(db, user, investigation_id)
