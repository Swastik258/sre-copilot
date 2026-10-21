# Prometheus setup

> **Status: implemented (read-only).** `/api/v1/metrics/query` and
> `/api/v1/metrics/correlate` are live, and `/metrics` is a live console.

## Configuration

| Env var | Purpose |
|---------|---------|
| `PROMETHEUS_ENABLED` | Master switch (default `false`) |
| `PROMETHEUS_URL` | Base URL of a Prometheus-compatible query API |
| `PROMETHEUS_DEMO_MODE` | Use labelled fixtures when enabled without a URL (default `true`) |
| `PROMETHEUS_REQUEST_TIMEOUT_SECONDS` | Per-query timeout (default 15) |

The adapter uses the standard library and issues only `GET
/api/v1/query_range`. There is no write, admin, delete, or configuration method.

### Live example

```bash
PROMETHEUS_ENABLED=true
PROMETHEUS_DEMO_MODE=false
PROMETHEUS_URL=http://localhost:9090
```

### Fixture example

```bash
PROMETHEUS_ENABLED=true
PROMETHEUS_URL=
PROMETHEUS_DEMO_MODE=true
```

When a URL is set it always selects the live adapter. Fixtures are clearly
labelled with `demo: true`, including evidence.

## Query safety

- Queries are read-only and run against `/api/v1/query_range`.
- `minutes` is bounded to 1–1440; `step` must be a positive Prometheus duration
  (`15s`, `1m`, `1h`, `1d`, `500ms`).
- Series output is bounded to 20 evidence records; the response still reports the
  returned series count and point count.
- Responses show the exact query, start/end, step, series, summary, and evidence.
- Missing series are reported as "no series"; the service never fabricates data.
- Upstream failures return `502 prometheus_api_error`; disabled/unconfigured
  integrations return `503 not_configured`.

## Correlation

`POST /api/v1/metrics/correlate` accepts a query plus timestamped events. For
each event, the service finds the closest metric point and computes a z-score
against the returned series baseline. Matches at `|z| >= 2` are returned (up to
50), with the strongest first, and the top 20 become evidence.

Correlation is a **timing signal**, not proof of causation. A missing match does
not prove the metric was unrelated. See `docs/API.md` for request/response
shapes.

## UI

`/metrics` lets an operator run a query, choose the time window/step, inspect
the returned series, and submit events for correlation. It labels fixture data
and shows upstream errors instead of substituting values.
