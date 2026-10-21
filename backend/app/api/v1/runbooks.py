"""Read-only runbook library endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.runbooks import (
    Runbook,
    RunbookListResponse,
    RunbookMatchRequest,
    RunbookMatchResponse,
)
from app.services.runbooks import get_runbook, list_runbooks, match_runbook

router = APIRouter(prefix="/runbooks", tags=["runbooks"])


@router.get("", response_model=RunbookListResponse)
def list_endpoint(
    query: Annotated[str | None, Query(max_length=200)] = None,
    category: Annotated[str | None, Query(max_length=80)] = None,
) -> RunbookListResponse:
    return list_runbooks(query=query, category=category)


@router.post("/match", response_model=RunbookMatchResponse)
def match_endpoint(payload: RunbookMatchRequest) -> RunbookMatchResponse:
    return match_runbook(payload)


@router.get("/{runbook_id}", response_model=Runbook)
def get_endpoint(runbook_id: str) -> Runbook:
    return get_runbook(runbook_id)
