"""Read-only Prometheus query models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class MetricPoint(BaseModel):
    timestamp: datetime
    value: float


class MetricSeries(BaseModel):
    name: str
    labels: dict[str, str] = Field(default_factory=dict)
    points: list[MetricPoint] = Field(default_factory=list)


class MetricQueryResult(BaseModel):
    series: list[MetricSeries] = Field(default_factory=list)
    demo: bool = False
