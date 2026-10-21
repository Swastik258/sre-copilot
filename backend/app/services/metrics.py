"""Deterministic Prometheus querying and metric/event correlation.

The adapter performs the network read. This service validates inputs, reduces
series to bounded evidence, and computes a simple z-score correlation. It never
claims causation: a match means the metric was unusual near the event, not that
it caused the event.
"""

from __future__ import annotations

import math
import re
from datetime import UTC, datetime, timedelta

from app.adapters.prometheus.client import build_prometheus_client
from app.adapters.prometheus.models import MetricSeries
from app.core.config import get_settings
from app.core.errors import ValidationError
from app.core.redaction import redact_text
from app.schemas.evidence import EvidenceSource, Severity
from app.schemas.metrics import (
    CorrelationEvent,
    CorrelationMatch,
    CorrelationResponse,
    MetricQueryResponse,
)
from app.services.evidence import build_evidence

_STEP_RE = re.compile(r"^\d+(?:ms|s|m|h|d)$")
_Z_THRESHOLD = 2.0


def _validate(query: str, step: str) -> None:
    if not query.strip():
        raise ValidationError("Metric query cannot be empty.")
    if len(query) > 2000:
        raise ValidationError("Metric query is too long.")
    if not _STEP_RE.fullmatch(step) or step.startswith("0"):
        raise ValidationError(
            "step must be a positive Prometheus duration such as 15s, 1m, or 1h."
        )


def _window(minutes: int) -> tuple[datetime, datetime]:
    end = datetime.now(UTC)
    return end - timedelta(minutes=minutes), end


def _stats(series: MetricSeries) -> tuple[float, float, float, float]:
    values = [point.value for point in series.points]
    if not values:
        return 0.0, 0.0, 0.0, 0.0
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    return min(values), max(values), mean, math.sqrt(variance)


def query_metrics(
    query: str, *, minutes: int = 15, step: str = "15s"
) -> MetricQueryResponse:
    _validate(query, step)
    start, end = _window(minutes)
    client = build_prometheus_client(get_settings())
    result = client.query(query, start=start, end=end, step=step)

    evidence = []
    for series in result.series[:20]:
        minimum, maximum, mean, stddev = _stats(series)
        evidence.append(
            build_evidence(
                source_type=EvidenceSource.prometheus,
                summary=(
                    f"Prometheus series {series.name} returned {len(series.points)} point(s); "
                    f"min={minimum:.4g}, max={maximum:.4g}, mean={mean:.4g}, stddev={stddev:.4g}."
                ),
                payload={
                    "query": query[:500],
                    "series": series.name,
                    "labels": series.labels,
                    "point_count": len(series.points),
                    "min": minimum,
                    "max": maximum,
                    "mean": mean,
                    "stddev": stddev,
                },
                source_resource=query[:300],
                provenance="prometheus.query",
                demo=result.demo,
            )
        )

    point_count = sum(len(series.points) for series in result.series)
    summary = (
        f"Prometheus returned {len(result.series)} series with "
        f"{point_count} data point(s)."
    )
    if not result.series:
        summary += " The query produced no series; check the metric name and labels."
    return MetricQueryResponse(
        query=query,
        start=start,
        end=end,
        step=step,
        series=result.series,
        summary=summary,
        evidence=evidence,
        demo=result.demo,
    )


def _closest_point(series: MetricSeries, timestamp: datetime):
    if not series.points:
        return None
    return min(series.points, key=lambda point: abs((point.timestamp - timestamp).total_seconds()))


def correlate_events(payload_query: str, *, minutes: int, step: str, events: list[CorrelationEvent]) -> CorrelationResponse:
    _validate(payload_query, step)
    start, end = _window(minutes)
    client = build_prometheus_client(get_settings())
    result = client.query(payload_query, start=start, end=end, step=step)

    matches: list[CorrelationMatch] = []
    for event in events:
        if event.timestamp < start or event.timestamp > end:
            continue
        for series in result.series:
            _, _, mean, stddev = _stats(series)
            point = _closest_point(series, event.timestamp)
            if point is None or stddev <= 0:
                continue
            z_score = (point.value - mean) / stddev
            if abs(z_score) < _Z_THRESHOLD:
                continue
            matches.append(
                CorrelationMatch(
                    event_label=event.label,
                    event_timestamp=event.timestamp,
                    metric_name=series.name,
                    labels=series.labels,
                    observed_value=point.value,
                    baseline_mean=mean,
                    baseline_stddev=stddev,
                    z_score=round(z_score, 3),
                    direction="above_baseline" if z_score > 0 else "below_baseline",
                )
            )

    matches.sort(key=lambda match: abs(match.z_score), reverse=True)
    matches = matches[:50]
    evidence = []
    for match in matches[:20]:
        item = build_evidence(
            source_type=EvidenceSource.prometheus,
            summary=(
                f"Metric {match.metric_name} was {match.direction} near "
                f"'{redact_text(match.event_label)}' (z={match.z_score:.2f})."
            ),
            payload={
                "query": payload_query[:500],
                "metric": match.metric_name,
                "labels": match.labels,
                "observed_value": match.observed_value,
                "baseline_mean": match.baseline_mean,
                "baseline_stddev": match.baseline_stddev,
                "z_score": match.z_score,
                "event_label": redact_text(match.event_label),
                "event_timestamp": match.event_timestamp.isoformat(),
            },
            source_resource=payload_query[:300],
            timestamp=match.event_timestamp,
            severity=(
                Severity.high
                if abs(match.z_score) >= 3
                else Severity.medium
            ),
            provenance="prometheus.correlate",
            demo=result.demo,
        )
        match.evidence_id = item.id
        evidence.append(item)

    if not events:
        summary = "No events were supplied to correlate."
    elif not matches:
        summary = (
            "No metric crossed the two-standard-deviation threshold near the "
            "supplied events. Absence of a match is not evidence of absence."
        )
    else:
        summary = (
            f"Found {len(matches)} metric/event correlation(s). Treat these as "
            "timing signals, not proof of causation."
        )
    return CorrelationResponse(
        query=payload_query,
        start=start,
        end=end,
        step=step,
        matches=matches,
        summary=summary,
        evidence=evidence,
        demo=result.demo,
    )
