"""Prometheus query and correlation contracts."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.adapters.prometheus.models import MetricSeries
from app.schemas.evidence import Evidence, Severity


class MetricQueryResponse(BaseModel):
    query: str
    start: datetime
    end: datetime
    step: str
    series: list[MetricSeries] = Field(default_factory=list)
    summary: str
    evidence: list[Evidence] = Field(default_factory=list)
    demo: bool = False


class CorrelationEvent(BaseModel):
    timestamp: datetime
    label: str = Field(min_length=1, max_length=300)
    severity: Severity = Severity.info


class CorrelationRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    minutes: int = Field(default=15, ge=1, le=1440)
    step: str = Field(default="15s", max_length=16)
    events: list[CorrelationEvent] = Field(default_factory=list, max_length=100)


class CorrelationMatch(BaseModel):
    event_label: str
    event_timestamp: datetime
    metric_name: str
    labels: dict[str, str] = Field(default_factory=dict)
    observed_value: float
    baseline_mean: float
    baseline_stddev: float
    z_score: float
    direction: str
    evidence_id: str | None = None


class CorrelationResponse(BaseModel):
    query: str
    start: datetime
    end: datetime
    step: str
    matches: list[CorrelationMatch] = Field(default_factory=list)
    summary: str
    evidence: list[Evidence] = Field(default_factory=list)
    demo: bool = False
