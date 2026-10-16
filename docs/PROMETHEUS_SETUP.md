# Prometheus setup (planned — not implemented)

> **Status: not implemented.** Metrics queries do not exist yet (Milestone 5).
> Configuration below is the intended shape.

## Intended configuration

| Env var | Purpose |
|---------|---------|
| `PROMETHEUS_ENABLED` | Master switch (default `false`) |
| `PROMETHEUS_URL` | Base URL of a Prometheus-compatible query API |
| `PROMETHEUS_REQUEST_TIMEOUT_SECONDS` | Per-query timeout |

## Query safety

- Queries are **read-only** (`/api/v1/query`, `/api/v1/query_range`).
- Enforce configurable time windows, result limits, and query validation.
- Always display the actual query, time range, returned data, and any errors.
- Never fabricate metric values or imply data exists when a server has none.

## Correlating with other evidence

Metric anomalies should be correlated with deployment events and log timestamps
only when the required labels/timestamps exist. Correlation is reported as a
hypothesis, not a proven cause, unless the evidence establishes more.
