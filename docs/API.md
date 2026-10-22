# API reference

Base URL (local): `http://localhost:8000`
Interactive docs: `/docs` · OpenAPI JSON: `/openapi.json`

All responses are JSON. Errors use a consistent envelope:

```json
{
  "error": {
    "code": "not_found",
    "message": "…",
    "details": null,
    "request_id": "…"
  }
}
```

Every response includes an `X-Request-ID` header (echoed if supplied). Responses
also include conservative security headers.

Authentication uses the `sre_session` `HttpOnly` cookie (or a bearer token in the
`Authorization` header for API clients). `AUTH_REQUIRED` defaults to `false` for
local demo use, but `ENVIRONMENT=production` always requires authentication.

---

## Meta

### `GET /`
Returns service name, version, docs path, and API prefix.

---

## Health

### `GET /api/v1/health`
Full health including a database check.

### `GET /api/v1/health/live`
Liveness — does not touch downstream dependencies.

### `GET /api/v1/health/ready`
Readiness — includes the database check.

---

## Integrations

### `GET /api/v1/integrations`
Reports the **configured** state of each integration. Never returns secrets.
`state` is one of `connected`, `enabled`, `unconfigured`, `demo`, or `disabled`.
Configuration state is not reachability.

---

## Authentication and authorization

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/signup` | Create an account and session |
| POST | `/api/v1/auth/login` | Create a session |
| POST | `/api/v1/auth/logout` | Revoke the current session |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/admin/users?tenant_id=&page=&page_size=` | List users (admin only) |
| PATCH | `/api/v1/admin/users/{user_id}` | Change role, tenant, or activation (admin only) |
| GET | `/api/v1/admin/tenants` | List tenants and user counts (admin only) |

`UserOut` includes `id`, `email`, `display_name`, `role` (`admin` or `member`),
`tenant_id`, `is_active`, and `created_at`.

Every public signup is a `member` in `DEFAULT_TENANT_ID`. Administrator
privileges must be granted from a trusted backend shell with
`python scripts/set_admin.py account@example.com`; signup email or registration
order never grants admin access. Admins can move a member to another tenant; their investigations are migrated.
The last active admin cannot be demoted or deactivated, and deactivation revokes
the member's sessions.

Example admin update:

```json
{
  "role": "member",
  "tenant_id": "team-payments",
  "is_active": true
}
```

All fields are optional. Invalid tenant IDs return `422 validation_error`.

### Customer account settings

Every endpoint below requires the current user session or a valid bearer API
key. Customer data is scoped to that user.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/account` | Profile, preferences, integration flags, active key metadata, and plan |
| PATCH | `/api/v1/account/profile` | Update display name/email; current password is required to change email |
| POST | `/api/v1/account/password` | Change password after validating the current password |
| PATCH | `/api/v1/account/preferences` | Save `theme` (`dark` or `system`) and notification preference |
| PUT | `/api/v1/account/integrations/{kind}` | Save account-level enablement for `kubernetes`, `github`, or `prometheus` |
| POST | `/api/v1/account/api-keys` | Create a named API key; the raw key is returned only once |
| DELETE | `/api/v1/account/api-keys/{key_id}` | Revoke one of the current user's keys |
| DELETE | `/api/v1/account` | Permanently delete the current account after password confirmation |

API key records store only a SHA-256 hash and a short display prefix. Use the
raw `key` from the create response as a bearer token; it cannot be retrieved
later. Integration enablement is a per-account preference and does not change
the operator-managed credentials or live connection configured on the backend.
The customer plan is currently `free` with all product features enabled; no
billing endpoints exist.

---

## Kubernetes (read-only)

These routes read from a cluster. **None of them mutate anything.** When the
integration is disabled they return `503 not_configured`; in demo mode they
serve labelled fixtures (`demo: true`).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/kubernetes/clusters` | Configured named clusters |
| GET | `/api/v1/kubernetes/namespaces?cluster=` | List namespaces |
| GET | `/api/v1/kubernetes/workloads?namespace=&cluster=` | Deployments/StatefulSets/DaemonSets |
| GET | `/api/v1/kubernetes/pods?namespace=&cluster=` | List pods with container statuses |
| GET | `/api/v1/kubernetes/pods/{namespace}/{name}?cluster=` | Single pod |
| GET | `/api/v1/kubernetes/pods/{namespace}/{name}/logs?container=&tail_lines=&previous=&cluster=` | Bounded logs |
| POST | `/api/v1/kubernetes/pods/{namespace}/{name}/diagnose?log_tail_lines=&cluster=` | Evidence-backed diagnosis |

The diagnose response returns a `Diagnosis` (confirmed observations, hypotheses,
read-only next steps, approval-gated remediation, confidence and its basis) plus
the `Evidence` records it cites.

Configure one legacy target:

```bash
KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=false
KUBERNETES_KUBECONFIG=C:/Users/you/.kube/kind-config
KUBERNETES_CONTEXT=kind-tws-cluster
KUBERNETES_IN_CLUSTER=false
```

Or configure named clusters (takes precedence):

```bash
KUBERNETES_CLUSTERS='[
  {"name":"kind-local","kubeconfig":"C:/Users/you/.kube/kind-config","context":"kind-tws-cluster"},
  {"name":"staging","kubeconfig":"C:/Users/you/.kube/staging","context":"staging"}
]'
```

Use the read-only RBAC in `docs/KUBERNETES_SETUP.md`. Live use needs
`pip install -e ".[kubernetes]"`.

---

## GitHub Actions (read-only)

These routes issue only GitHub `GET` requests. There is no dispatch, re-run,
cancel, secret, or write endpoint. The token is configured server-side and never
returned.
Repository values accept `owner/name` or an HTTPS URL such as
`https://github.com/owner/name.git`; URLs are normalized to `owner/name`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/github/runs?repo=owner/name&branch=&limit=` | List recent workflow runs |
| GET | `/api/v1/github/runs/{run_id}?repo=owner/name` | Run, jobs, and steps |
| POST | `/api/v1/github/runs/{run_id}/diagnose?repo=owner/name&log_tail_lines=` | Evidence-backed run diagnosis |

Failed-job logs are optional supporting evidence; missing logs are reported in
`missing_evidence`. Log excerpts are bounded and redacted, and cross-host
log-download redirects strip the GitHub token.

Use a fine-grained token limited to `Actions: read`, `Contents: read`, and
`Metadata: read`. See `docs/GITHUB_SETUP.md`.

---

## Terraform plan review (read-only)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/terraform/review` | Review a `terraform show -json` plan object |
| POST | `/api/v1/terraform/explain` | Review plus optional AI explanation |

Request:

```json
{
  "plan": {
    "format_version": "1.2",
    "terraform_version": "1.9.0",
    "resource_changes": []
  },
  "question": "What should I verify before apply?"
}
```

The review response contains summary counts, a `blast_radius`, normalized
resource changes, findings, and evidence. Attribute names are returned; values
are deliberately omitted because plan files may contain sensitive data. The
endpoint never runs Terraform or reads cloud credentials.

The explain response adds `explanation`, a `StructuredDiagnosis` built only from
the deterministic review evidence. It returns `503 not_configured` when AI is
unavailable or privacy mode blocks the provider. See `docs/TERRAFORM_REVIEW.md`.

---

## AI explanation (optional)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/ai/diagnose` | Explain supplied evidence with the configured provider |
| POST | `/api/v1/ai/summarize` | Alias for the same operation |

The response is a `StructuredDiagnosis`: summary, confidence, cited hypotheses,
read-only next steps, risks, unknowns, and approval-gated proposed remediation.
It is labelled `model_generated: true` except for the deterministic mock.
Deterministic diagnosis remains authoritative.

Only evidence **summaries** and the question are sent to the provider. Payloads
and credentials are not forwarded. Providers: `mock`, `openai`, `openrouter`,
and native `anthropic`. See `docs/AI_PROVIDERS.md`.

---

## Logs

### `POST /api/v1/logs/analyze`

```json
{
  "text": "2026-10-21T12:00:00Z ERROR checkout failed\n...",
  "source": "checkout-7f9",
  "environment": "production",
  "limit": 50
}
```

Returns `total_lines`, `parsed_lines`, `truncated`, grouped `signatures`
(severity, count, first/last seen, sample, stack frames), a summary, and
evidence. Raw log text is not persisted or sent to an external model. Input is
capped at 1,000,000 characters.

---

## Metrics and correlation

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/metrics/query?query=&minutes=&step=` | Read-only Prometheus query |
| POST | `/api/v1/metrics/correlate` | Correlate metric anomalies with events |

`GET /metrics/query` runs a read-only `query_range` against the configured
Prometheus-compatible API. `minutes` is 1–1440; `step` is a Prometheus duration.
When enabled without a URL and `PROMETHEUS_DEMO_MODE=true`, labelled fixture
series are returned. Responses include the exact query, start/end, step, series,
summary, evidence, and `demo`.

Correlation request:

```json
{
  "query": "rate(http_requests_total{job=\"checkout\"}[5m])",
  "minutes": 15,
  "step": "15s",
  "events": [
    {
      "timestamp": "2026-10-21T12:00:00Z",
      "label": "checkout deploy",
      "severity": "info"
    }
  ]
}
```

Matches report the event, metric/labels, observed and baseline values, z-score,
direction, and evidence. Correlation is a hypothesis, not proof of causality.

---

## Runbooks

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/runbooks?query=&category=` | List/search the read-only catalog |
| GET | `/api/v1/runbooks/{id}` | Runbook detail |
| POST | `/api/v1/runbooks/match` | Match a finding kind/signal to a runbook |

Match request:

```json
{"kind": "crash_loop", "signal": "restart count climbing"}
```

Runbooks contain symptoms, read-only steps, optional commands, expected results,
guardrails, and explicit `changes_state` risk labels. Unknown IDs return `404`.

---

## Infrastructure-code generation (proposal only)

### `POST /api/v1/infra/generate`

```json
{
  "kind": "kubernetes_deployment",
  "name": "checkout",
  "namespace": "shop",
  "image": "ghcr.io/acme/checkout:1.4.2",
  "replicas": 2,
  "port": 8080,
  "environment": "production",
  "cpu_request": "100m",
  "memory_request": "128Mi",
  "cpu_limit": "500m",
  "memory_limit": "512Mi",
  "intent": "Serve checkout traffic with a reversible rollout."
}
```

`kind` is `kubernetes_deployment`, `kubernetes_service`, or `terraform_module`.
The response contains proposed `files`, baseline `findings`, a summary, and
evidence. Nothing is written, applied, or deployed. Mutable image tags and other
baseline policy issues are reported, not fixed.

---

## Investigations and assistant

Authenticated. Members see only their own investigations; admins may inspect
across tenants.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/investigations` | Create an investigation |
| GET | `/api/v1/investigations?status=&kind=&page=&page_size=` | List |
| GET | `/api/v1/investigations/{id}` | Detail |
| GET | `/api/v1/investigations/{id}/messages` | Message history |
| POST | `/api/v1/investigations/{id}/messages` | Ask the assistant |
| GET | `/api/v1/investigations/{id}/evidence` | Attached evidence |
| POST | `/api/v1/investigations/{id}/close` | Close the investigation |

Create request:

```json
{"title": "Checkout failure", "kind": "kubernetes", "environment": "production"}
```

Message request:

```json
{"content": "Why is the checkout pod crash-looping?"}
```

Messages are persisted in `Investigation.result["messages"]`; shared evidence
stays in the `Evidence` table. AI exchange uses the configured provider and
per-tenant privacy policy, and returns an AI `StructuredDiagnosis`.

---

## Audit

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/audit-events?limit=&offset=&action=&actor=&decision=&before=&after=` | Filtered audit trail |
| GET | `/api/v1/audit-events/export.csv` | CSV export |
| DELETE | `/api/v1/audit-events?older_than_days=` | Delete old events (admin only) |

Members see only audit events they created, within their tenant; admins can
inspect across tenants. Resource and outcome payloads are redacted before
persistence. Retention is admin-only, currently applies across all tenants, and
is itself audited.

---

## Settings

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/settings` | Per-tenant operational settings |
| PATCH | `/api/v1/settings` | Update settings (admin only) |

Writable fields: `audit_retention_days`, `ai_privacy_mode`, and
`default_environment`. Provider keys, tokens, and connection strings are
environment-only and are neither accepted nor returned. Settings are scoped to
the caller's tenant.

---

## Error codes

| HTTP | `code` | Meaning |
|------|--------|---------|
| 400 | `bad_request` | Malformed request |
| 401 | `unauthorized` | Missing/invalid credentials |
| 403 | `forbidden` | Authenticated but lacking the required role |
| 404 | `not_found` | Resource missing |
| 409 | `conflict` | State conflict, including last-admin protection |
| 413 | `payload_too_large` | Body exceeds `MAX_REQUEST_BYTES` |
| 422 | `validation_error` | Schema validation failed |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Unexpected server error |
| 502 | `ai_provider_error` | External AI provider failed or returned unusable output |
| 502 | `github_api_error` | GitHub rejected or failed a read-only request |
| 502 | `prometheus_api_error` | Prometheus rejected or failed a read-only request |
| 503 | `not_configured` | Integration requested but not configured |
