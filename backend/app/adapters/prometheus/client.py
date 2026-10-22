"""Read-only Prometheus client.

Only ``GET /api/v1/query_range`` is issued. There is no write, admin, delete, or
configuration method. Queries are validated and bounded by the API layer.
"""

from __future__ import annotations

import json
import math
import urllib.error
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol, runtime_checkable

from app.adapters.prometheus.models import MetricPoint, MetricQueryResult, MetricSeries
from app.core.config import Settings
from app.core.errors import NotConfiguredError, PrometheusAPIError
from app.core.redaction import redact_text


@runtime_checkable
class PrometheusReadClient(Protocol):
    demo: bool

    def query(
        self, query: str, *, start: datetime, end: datetime, step: str = "15s"
    ) -> MetricQueryResult: ...


class FixturePrometheusClient:
    """Deterministic metric series for local demos and tests."""

    demo = True

    def query(
        self, query: str, *, start: datetime, end: datetime, step: str = "15s"
    ) -> MetricQueryResult:
        step_seconds = _step_seconds(step)
        count = max(2, min(240, int((end - start).total_seconds() // step_seconds) + 1))
        series: list[MetricSeries] = []
        for offset, name in enumerate(("http_requests_total", "http_request_errors_total")):
            points: list[MetricPoint] = []
            for index in range(count):
                timestamp = start + timedelta(seconds=index * step_seconds)
                wave = math.sin(index / 5 + offset)
                spike = 4.0 if index in {count // 2, count // 2 + 1, count - 1} else 1.0
                value = round((10.0 + offset * 2.0 + wave) * spike, 4)
                points.append(MetricPoint(timestamp=timestamp, value=value))
            series.append(
                MetricSeries(
                    name=name,
                    labels={"instance": "demo", "job": "sre-copilot", "query": query[:80]},
                    points=points,
                )
            )
        return MetricQueryResult(series=series, demo=True)


class RealPrometheusClient:
    """Read-only Prometheus HTTP API client using the standard library."""

    demo = False

    def __init__(self, settings: Settings) -> None:
        self._base_url = (settings.prometheus_url or "").rstrip("/")
        self._timeout = settings.prometheus_request_timeout_seconds

    def _get(self, path: str, params: dict[str, str]) -> dict[str, Any]:
        url = f"{self._base_url}{path}?{urllib.parse.urlencode(params)}"
        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "sre-copilot/0.2",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:  # nosec B310
                raw = response.read(5_000_000)
        except urllib.error.HTTPError as exc:
            message = ""
            try:
                message = exc.read().decode("utf-8", "replace")[:300]
            except Exception:
                message = ""
            raise PrometheusAPIError(
                f"Prometheus returned HTTP {exc.code}.",
                details={
                    "status": exc.code,
                    "message": redact_text(message) if message else None,
                    "hint": "Check PROMETHEUS_URL and query permissions.",
                },
            ) from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            raise PrometheusAPIError(
                "Could not reach Prometheus.",
                details={"hint": "Check network access and PROMETHEUS_URL."},
            ) from exc

        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise PrometheusAPIError("Prometheus returned an unreadable response.") from exc
        if not isinstance(payload, dict):
            raise PrometheusAPIError("Prometheus returned an unexpected response shape.")
        return payload

    def query(
        self, query: str, *, start: datetime, end: datetime, step: str = "15s"
    ) -> MetricQueryResult:
        payload = self._get(
            "/api/v1/query_range",
            {
                "query": query,
                "start": f"{start.timestamp():.3f}",
                "end": f"{end.timestamp():.3f}",
                "step": step,
            },
        )
        if payload.get("status") != "success":
            raise PrometheusAPIError(
                "Prometheus rejected the query.",
                details={"error": redact_text(str(payload.get("error") or "unknown error"))},
            )

        data = payload.get("data") or {}
        result = data.get("result") if isinstance(data, dict) else None
        if not isinstance(result, list):
            raise PrometheusAPIError("Prometheus returned no result list.")

        series: list[MetricSeries] = []
        for item in result:
            if not isinstance(item, dict):
                continue
            raw_metric = item.get("metric")
            metric: dict[str, Any] = raw_metric if isinstance(raw_metric, dict) else {}
            labels = {str(key): str(value) for key, value in metric.items() if key != "__name__"}
            name = str(metric.get("__name__") or labels.get("job") or "metric")
            raw_points = item.get("values") or []
            if not raw_points and item.get("value"):
                raw_points = [item["value"]]
            points: list[MetricPoint] = []
            if isinstance(raw_points, list):
                for raw_point in raw_points:
                    if not isinstance(raw_point, (list, tuple)) or len(raw_point) < 2:
                        continue
                    try:
                        timestamp = datetime.fromtimestamp(float(raw_point[0]), UTC)
                        value = float(raw_point[1])
                    except (TypeError, ValueError, OSError):
                        continue
                    if not math.isfinite(value):
                        continue
                    points.append(MetricPoint(timestamp=timestamp, value=value))
            if points:
                series.append(MetricSeries(name=name, labels=labels, points=points))
        return MetricQueryResult(series=series, demo=False)


def _step_seconds(step: str) -> int:
    if step.endswith("ms"):
        return max(1, int(float(step[:-2]) / 1000))
    if step.endswith("s"):
        return max(1, int(float(step[:-1])))
    if step.endswith("m"):
        return max(1, int(float(step[:-1]) * 60))
    if step.endswith("h"):
        return max(1, int(float(step[:-1]) * 3600))
    if step.endswith("d"):
        return max(1, int(float(step[:-1]) * 86400))
    return 15


def build_prometheus_client(settings: Settings) -> PrometheusReadClient:
    if not settings.prometheus_enabled:
        raise NotConfiguredError(
            "Prometheus integration is disabled.",
            details={"hint": "Set PROMETHEUS_ENABLED=true to enable read-only queries."},
        )
    if not settings.prometheus_url:
        if settings.prometheus_demo_mode:
            return FixturePrometheusClient()
        raise NotConfiguredError(
            "Prometheus is enabled but PROMETHEUS_URL is not set.",
            details={"hint": "Set PROMETHEUS_URL or enable PROMETHEUS_DEMO_MODE."},
        )
    return RealPrometheusClient(settings)
