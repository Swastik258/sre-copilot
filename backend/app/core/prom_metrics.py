"""Small dependency-free Prometheus registry.

The process exposes counters, gauges, and histograms in the Prometheus text
format. Labels are limited to route templates, methods, status codes, and job
states so cardinality cannot be driven by user input. The registry is
per-process, matching the app's current single-worker rate limiter; scrape all
replicas or use a Prometheus service discovery setup.
"""

from __future__ import annotations

import math
import threading
from collections import defaultdict
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field

CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8"
DEFAULT_BUCKETS = (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)


def _escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')


def _fmt(value: float) -> str:
    if math.isinf(value):
        return "+Inf" if value > 0 else "-Inf"
    if math.isnan(value):
        return "NaN"
    return f"{value:.12g}"


def _labels(
    names: Sequence[str], values: Mapping[str, str]
) -> str:
    if not names:
        return ""
    rendered = ",".join(f'{name}="{_escape(str(values[name]))}"' for name in names)
    return "{" + rendered + "}"


@dataclass
class Counter:
    name: str
    help: str
    labelnames: tuple[str, ...] = ()
    values: dict[tuple[str, ...], float] = field(
        default_factory=lambda: defaultdict(float)
    )

    def labels(self, **values: str) -> Counter:
        missing = set(self.labelnames) - set(values)
        extra = set(values) - set(self.labelnames)
        if missing or extra:
            raise ValueError(f"Counter {self.name} label mismatch")
        return _BoundCounter(self, tuple(str(values[name]) for name in self.labelnames))

    def inc(self, amount: float = 1.0) -> None:
        with _LOCK:
            self.values[()] += amount

    def render(self) -> list[str]:
        lines = [f"# HELP {self.name} {self.help}", f"# TYPE {self.name} counter"]
        with _LOCK:
            items = list(self.values.items())
        for key, value in items:
            lines.append(
                f"{self.name}{_labels(self.labelnames, dict(zip(self.labelnames, key, strict=True)))} {_fmt(value)}"
            )
        return lines


@dataclass
class _BoundCounter:
    metric: Counter
    key: tuple[str, ...]

    def inc(self, amount: float = 1.0) -> None:
        with _LOCK:
            self.metric.values[self.key] += amount


@dataclass
class Gauge:
    name: str
    help: str
    labelnames: tuple[str, ...] = ()
    values: dict[tuple[str, ...], float] = field(default_factory=dict)

    def inc(self, amount: float = 1.0) -> None:
        with _LOCK:
            self.values[()] = self.values.get((), 0.0) + amount

    def dec(self, amount: float = 1.0) -> None:
        self.inc(-amount)

    def labels(self, **values: str) -> Gauge:
        missing = set(self.labelnames) - set(values)
        extra = set(values) - set(self.labelnames)
        if missing or extra:
            raise ValueError(f"Gauge {self.name} label mismatch")
        return _BoundGauge(self, tuple(str(values[name]) for name in self.labelnames))

    def set(self, value: float) -> None:
        with _LOCK:
            self.values[()] = value

    def render(self) -> list[str]:
        lines = [f"# HELP {self.name} {self.help}", f"# TYPE {self.name} gauge"]
        with _LOCK:
            items = list(self.values.items())
        for key, value in items:
            lines.append(
                f"{self.name}{_labels(self.labelnames, dict(zip(self.labelnames, key, strict=True)))} {_fmt(value)}"
            )
        return lines


@dataclass
class _BoundGauge:
    metric: Gauge
    key: tuple[str, ...]

    def set(self, value: float) -> None:
        with _LOCK:
            self.metric.values[self.key] = value

    def inc(self, amount: float = 1.0) -> None:
        with _LOCK:
            self.metric.values[self.key] = self.metric.values.get(self.key, 0.0) + amount

    def dec(self, amount: float = 1.0) -> None:
        self.inc(-amount)


@dataclass
class Histogram:
    name: str
    help: str
    labelnames: tuple[str, ...] = ()
    buckets: tuple[float, ...] = DEFAULT_BUCKETS
    values: dict[tuple[str, ...], list[float]] = field(
        default_factory=lambda: defaultdict(list)
    )
    sums: dict[tuple[str, ...], float] = field(
        default_factory=lambda: defaultdict(float)
    )
    counts: dict[tuple[str, ...], int] = field(
        default_factory=lambda: defaultdict(int)
    )

    def labels(self, **values: str) -> Histogram:
        missing = set(self.labelnames) - set(values)
        extra = set(values) - set(self.labelnames)
        if missing or extra:
            raise ValueError(f"Histogram {self.name} label mismatch")
        return _BoundHistogram(
            self, tuple(str(values[name]) for name in self.labelnames)
        )

    def observe(self, value: float) -> None:
        with _LOCK:
            self.values[()].append(value)
            self.sums[()] += value
            self.counts[()] += 1

    def render(self) -> list[str]:
        lines = [f"# HELP {self.name} {self.help}", f"# TYPE {self.name} histogram"]
        with _LOCK:
            keys = sorted(set(self.values) | set(self.sums) | set(self.counts))
            values = {key: list(self.values.get(key, [])) for key in keys}
            sums = {key: self.sums.get(key, 0.0) for key in keys}
            counts = {key: self.counts.get(key, 0) for key in keys}
        for key in keys:
            labels = dict(zip(self.labelnames, key, strict=True))
            base = _labels(self.labelnames, labels)
            observations = values[key]
            for bucket in self.buckets:
                count = sum(1 for item in observations if item <= bucket)
                bucket_labels = {**labels, "le": _fmt(bucket)}
                lines.append(
                    f"{self.name}_bucket{_labels((*self.labelnames, 'le'), bucket_labels)} {count}"
                )
            inf_labels = {**labels, "le": "+Inf"}
            lines.append(
                f"{self.name}_bucket{_labels((*self.labelnames, 'le'), inf_labels)} {counts[key]}"
            )
            lines.append(f"{self.name}_sum{base} {_fmt(sums[key])}")
            lines.append(f"{self.name}_count{base} {counts[key]}")
        return lines


@dataclass
class _BoundHistogram:
    metric: Histogram
    key: tuple[str, ...]

    def observe(self, value: float) -> None:
        with _LOCK:
            self.metric.values[self.key].append(value)
            self.metric.sums[self.key] += value
            self.metric.counts[self.key] += 1


_LOCK = threading.Lock()
_REGISTRY: list[Counter | Gauge | Histogram] = []


def register(metric: Counter | Gauge | Histogram) -> None:
    _REGISTRY.append(metric)


def render() -> str:
    lines: list[str] = []
    for metric in _REGISTRY:
        lines.extend(metric.render())
    return "\n".join(lines) + "\n"


HTTP_REQUESTS = Counter(
    "sre_copilot_http_requests_total",
    "HTTP requests processed, labelled by method, route template, and status.",
    ("method", "route", "status"),
)
HTTP_DURATION = Histogram(
    "sre_copilot_http_request_duration_seconds",
    "HTTP request latency by method and route template.",
    ("method", "route"),
)
HTTP_IN_FLIGHT = Gauge(
    "sre_copilot_http_requests_in_flight", "Requests currently being processed."
)
DB_READY = Gauge("sre_copilot_database_ready", "1 when the readiness DB probe succeeds.")
JOBS_PROCESSED = Counter(
    "sre_copilot_background_jobs_total",
    "Background jobs processed, labelled by outcome.",
    ("status",),
)

for _metric in (HTTP_REQUESTS, HTTP_DURATION, HTTP_IN_FLIGHT, DB_READY, JOBS_PROCESSED):
    register(_metric)
