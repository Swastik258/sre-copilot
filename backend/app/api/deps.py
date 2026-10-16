"""Shared FastAPI dependencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import PageParams

DbSession = Annotated[Session, Depends(get_db)]


def page_params(
    page: int = Query(default=1, ge=1, description="1-based page number"),
    page_size: int = Query(default=25, ge=1, le=200, description="Items per page"),
) -> PageParams:
    return PageParams(page=page, page_size=page_size)


Pagination = Annotated[PageParams, Depends(page_params)]
