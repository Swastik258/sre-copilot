"""Read-only Prometheus query and correlation endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.schemas.metrics import (
    CorrelationRequest,
    CorrelationResponse,
    MetricQueryResponse,
)
from app.services.metrics import correlate_events, query_metrics

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/query", response_model=MetricQueryResponse)
def query(
    query: Annotated[str, Query(min_length=1, max_length=2000)],
    minutes: Annotated[int, Query(ge=1, le=1440)] = 15,
    step: Annotated[str, Query(max_length=16)] = "15s",
) -> MetricQueryResponse:
    return query_metrics(query, minutes=minutes, step=step)


@router.post("/correlate", response_model=CorrelationResponse)
def correlate(payload: CorrelationRequest) -> CorrelationResponse:
    return correlate_events(
        payload.query,
        minutes=payload.minutes,
        step=payload.step,
        events=payload.events,
    )
