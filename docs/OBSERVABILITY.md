# Logs, metrics, traces, health, and backups

> **Status.** Structured logs, request correlation, Prometheus text metrics,
> `/health/live` and `/health/ready`, optional OpenTelemetry/Sentry export, and
> local backup/restore scripts are implemented. No hosted dashboard, paging
> provider, managed backup service, or tested RPO/RTO is included.

## Structured logs

`LOG_JSON=true` emits one JSON object per line. Plain logs remain available for
local development. Every record includes timestamp, level, logger, message,
service, environment, version, and the current `request_id`. A valid
OpenTelemetry span additionally adds `trace_id` and `span_id`.

Access logs use route **templates**, not raw paths or query strings:

```json
{
  "event": "request.completed",
  "http_method": "GET",
  "http_route": "/api/v1/investigations/{investigation_id}",
  "http_status": 200,
  "duration_ms": 12.4,
  "request_id": "6f1f...",
  "trace_id": "4bf92f..."
}
```

Deliberate exclusions: query strings, request/response bodies, cookies,
authorization headers, client IP addresses, user agents, email addresses, and
user ids. Incoming `X-Request-ID` values are accepted only when they are 1-128
ASCII letters, digits, `.`, `_`, `:`, or `-`; otherwise a new UUID is generated.
Newlines are escaped in plain logs to prevent log forging.

The redaction filter also scrubs traceback text before formatting. Redaction is
defence in depth, not permission to log secrets.

## Prometheus metrics

`GET /metrics` serves the Prometheus text format. It is exempt from API rate
limits and is not part of the OpenAPI schema.

Current series:

| Metric | Type | Labels |
|--------|------|--------|
| `sre_copilot_http_requests_total` | counter | `method`, `route` template, `status` |
| `sre_copilot_http_request_duration_seconds` | histogram | `method`, `route` template |
| `sre_copilot_http_requests_in_flight` | gauge | none |
| `sre_copilot_database_ready` | gauge | none |
| `sre_copilot_background_jobs_total` | counter | `status` (`succeeded`, `retry`, `failed`) |

`METRICS_ENABLED=false` makes `/metrics` return 404. Set
`METRICS_BEARER_TOKEN` to require `Authorization: Bearer <token>`. Production
startup fails if metrics are enabled without a token unless
`METRICS_ALLOW_UNAUTHENTICATED=true` is explicitly set for a network-isolated
scrape path. Prefer both a token and a private listener/network policy.

The registry is per process. Scrape every replica, or aggregate in Prometheus.
Metrics intentionally omit tenant, user, route parameter values, and business
amounts.

Example scrape config:

```yaml
scrape_configs:
  - job_name: sre-copilot
    metrics_path: /metrics
    authorization:
      credentials_file: /etc/prometheus/sre-copilot-metrics-token
    static_configs:
      - targets: ["sre-copilot-api:8000"]
```

## Health endpoints

| Endpoint | Purpose | Behaviour |
|----------|---------|-----------|
| `/api/v1/health/live` | Process liveness | Never checks the database or integrations. |
| `/api/v1/health/ready` | Traffic readiness | Checks database connectivity and, in production, the Alembic revision. Returns HTTP 503 when not ready. |
| `/api/v1/health` | Backward-compatible status | Returns a full status object with `checks`. |

Readiness never performs external integration I/O, so a GitHub or Prometheus
outage does not remove the API from service. The checks include database,
migration state, auth mode, background-job configuration, and metrics state.
Details never include credentials.

Kubernetes probe example:

```yaml
livenessProbe:
  httpGet: { path: /api/v1/health/live, port: 8000 }
readinessProbe:
  httpGet: { path: /api/v1/health/ready, port: 8000 }
```

## OpenTelemetry traces

The HTTP middleware emits server spans through the OpenTelemetry API:
`http.method`, `http.route`, and `http.response.status_code`. Incoming
`traceparent`, `tracestate`, and `baggage` headers are propagated. Spans do not
include bodies, query strings, cookies, addresses, or user identifiers.

Export is opt-in and requires the optional packages:

```sh
pip install -e ".[observability]"
```

```dotenv
OTEL_ENABLED=true
OTEL_SERVICE_NAME=sre-copilot-api
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com/v1/traces
OTEL_TRACES_SAMPLE_RATIO=0.1
```

The endpoint must be HTTPS in production and must not point at a metadata
service. If no endpoint is configured, spans are sampled but not exported. The
provider is flushed during application shutdown.

## Error tracking

Sentry support is optional and disabled unless `SENTRY_DSN` is set:

```dotenv
SENTRY_DSN=https://public@errors.example.com/123
SENTRY_TRACES_SAMPLE_RATE=0.0
```

The integration disables default PII, never sends request bodies, drops user
objects and sensitive headers/query strings, and recursively redacts event data
before sending. Application 4xx errors are not treated as incidents; unhandled
errors are reported by the SDK. Do not put DSNs or tokens in frontend code or
source control.

## Background-job visibility

With `BACKGROUND_JOBS_ENABLED=true`, workers retry failures with exponential
backoff up to `BACKGROUND_JOB_MAX_ATTEMPTS`; abandoned `running` jobs are
returned to the queue after a hard crash. Job payloads are encrypted with
`CREDENTIAL_ENCRYPTION_KEY`, and successful payloads are cleared.

Operational queries:

```sql
SELECT status, count(*) FROM background_jobs GROUP BY status;
SELECT kind, status, attempts, available_at, last_error
FROM background_jobs WHERE status IN ('retry', 'failed') ORDER BY updated_at DESC;
```

Never inspect or log `encrypted_payload`. Failed jobs may need operator action
after the retry budget is exhausted.

## Backup and restore

`deploy/backup.sh` supports PostgreSQL custom-format dumps and SQLite online
backups. It writes a SHA-256 sidecar, verifies PostgreSQL archives with
`pg_restore --list`, and applies `RETENTION_DAYS` (default 14) locally.

```sh
DATABASE_URL='postgresql+psycopg://user@db:5432/sre_copilot' \
BACKUP_DIR=/secure/backups RETENTION_DAYS=30 ./deploy/backup.sh
```

`deploy/restore.sh` is deliberately guarded. It requires a reviewed backup
file, `CONFIRM_RESTORE=yes`, and for production also
`ALLOW_PRODUCTION_RESTORE=yes`. Stop writers, take a fresh backup, and verify
the checksum first.

```sh
DATABASE_URL='postgresql+psycopg://user@db:5432/sre_copilot' \
BACKUP_FILE=/secure/backups/sre-copilot-20260101T000000Z.dump \
CONFIRM_RESTORE=yes ./deploy/restore.sh
```

Do not pass passwords on command lines; use `.pgpass`, a secret-mounted
`PGPASSFILE`, or the platform's IAM authentication. Copy backups to encrypted,
versioned, off-host storage and test restore drills against a disposable
database. This repository makes no RPO/RTO guarantee until a drill is recorded.

## Suggested alerts (not shipped)

- Readiness failing for two consecutive minutes.
- HTTP 5xx rate above baseline.
- `sre_copilot_background_jobs_total{status="failed"}` increasing.
- Database pool saturation or elevated latency (requires driver metrics, not
  exposed by this app yet).
- Certificate expiry and scrape-target absence (monitor at the edge).
