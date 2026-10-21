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

Every response includes an `X-Request-ID` header (echoed if supplied).

---

## Meta

### `GET /`
Returns service name, version, docs path, and API prefix.

---

## Health

### `GET /api/v1/health`
Full health including a database check.

```json
{
  "status": "ok",
  "database": "ok",
  "version": "0.2.0",
  "environment": "local",
  "ai_provider": "mock",
  "demo_mode": true,
  "integrations_enabled": []
}
```

### `GET /api/v1/health/live`
Liveness — does not touch downstream dependencies. `database` is `"skipped"`.

### `GET /api/v1/health/ready`
Readiness — includes the database check.

---

## Integrations

### `GET /api/v1/integrations`
Reports the **configured** state of each integration. Never returns secrets.

```json
{
  "demo_mode": true,
  "integrations": [
    {
      "kind": "kubernetes",
      "name": "Kubernetes",
      "state": "disabled",
      "enabled": false,
      "read_only": true,
      "detail": "Read-only Kubernetes diagnosis is disabled.",
      "demo": false
    }
  ]
}
```

`state` is one of: `connected`, `enabled`, `unconfigured`, `demo`, `disabled`.

> `state` describes configuration, not reachability. A live adapter upgrades its
> own state to `connected` only after a successful read.

---

## Kubernetes (read-only)

These routes read from a cluster. **None of them mutate anything.** When the
integration is disabled they return `503 not_configured`; in demo mode they
serve labelled fixtures (`demo: true`).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/kubernetes/clusters` | Configured cluster (demo flag included) |
| GET | `/api/v1/kubernetes/namespaces` | List namespaces |
| GET | `/api/v1/kubernetes/workloads?namespace=` | Deployments/StatefulSets/DaemonSets |
| GET | `/api/v1/kubernetes/pods?namespace=` | List pods with container statuses |
| GET | `/api/v1/kubernetes/pods/{namespace}/{name}` | Single pod |
| GET | `/api/v1/kubernetes/pods/{namespace}/{name}/logs?container=&tail_lines=&previous=` | Bounded logs |
| POST | `/api/v1/kubernetes/pods/{namespace}/{name}/diagnose?log_tail_lines=` | Evidence-backed diagnosis |

The diagnose response returns a `Diagnosis` (confirmed observations, hypotheses
with confidences, read-only next steps, approval-gated remediation, confidence
and its basis) plus the `Evidence` records it cites.

Enabling demo mode:

```bash
KUBERNETES_ENABLED=true
KUBERNETES_DEMO_MODE=true
```

For a live cluster set `KUBERNETES_KUBECONFIG` (or `KUBERNETES_IN_CLUSTER=true`)
and `KUBERNETES_DEMO_MODE=false`, and apply the read-only RBAC in
docs/KUBERNETES_SETUP.md. Live use also needs the optional dependency:
`pip install -e ".[kubernetes]"`.

---

## GitHub Actions (read-only)

These routes issue only GitHub `GET` requests. There is no dispatch, re-run,
cancel, secret, or write endpoint. The token is configured server-side and never
returned.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/github/runs?repo=owner/name&branch=&limit=` | List recent workflow runs |
| GET | `/api/v1/github/runs/{run_id}?repo=owner/name` | Run, jobs, and steps |
| POST | `/api/v1/github/runs/{run_id}/diagnose?repo=owner/name&log_tail_lines=` | Evidence-backed run diagnosis |

The diagnose response returns the run, jobs, a `Diagnosis`, and the `Evidence`
records it cites. Failed-job logs are optional supporting evidence; missing logs
are reported in `missing_evidence`. Log excerpts are bounded and redacted, and
cross-host log-download redirects strip the GitHub token.

Configuration:

```bash
GITHUB_ENABLED=true
GITHUB_TOKEN=github_pat_...
GITHUB_API_URL=https://api.github.com
```

Use a fine-grained token limited to `Actions: read`, `Contents: read`, and
`Metadata: read`. See `docs/GITHUB_SETUP.md`.

---

## Terraform plan review (read-only)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/terraform/review` | Review a `terraform show -json` plan object |

Request:

```json
{
  "plan": {
    "format_version": "1.2",
    "terraform_version": "1.9.0",
    "resource_changes": []
  }
}
```

The response contains summary counts, a `blast_radius`, normalized resource
changes, findings, and evidence. Replacement/destroy actions and stateful
resources are highlighted. Attribute names are returned; attribute values are
deliberately omitted because plan files may contain sensitive data. The endpoint
never runs Terraform or reads cloud credentials. See
`docs/TERRAFORM_REVIEW.md`.

---

## AI explanation (model-generated, optional)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/ai/diagnose` | Explain supplied evidence with the configured provider |
| POST | `/api/v1/ai/summarize` | Alias for the same operation |

Request:

```json
{
  "question": "Why is this pod failing?",
  "surface": "kubernetes",
  "evidence": [
    {
      "id": "ev-1",
      "source_type": "kubernetes",
      "collected_at": "2026-10-21T12:00:00Z",
      "severity": "high",
      "summary": "Container image pull failed with ErrImagePull.",
      "redacted": true,
      "demo": false
    }
  ]
}
```

The response is a `StructuredDiagnosis`: a summary, confidence, cited
hypotheses, read-only next steps, risks, unknowns, and approval-gated proposed
remediation. It is labelled `model_generated: true` (except for the deterministic
mock provider) and the deterministic Kubernetes diagnosis remains authoritative.

Only evidence **summaries** and the question are sent to the provider. Payloads
and credentials are not forwarded. Configure the server-side key in `.env`:

```bash
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Errors: `503 not_configured` when the provider/key is missing or privacy mode is
on; `502 ai_provider_error` when the upstream call fails or returns unusable
JSON. See `docs/AI_PROVIDERS.md`.

---

## Error codes

| HTTP | `code` | Meaning |
|------|--------|---------|
| 400 | `bad_request` | Malformed request |
| 401 | `unauthorized` | Missing/invalid credentials (enforced only when `AUTH_REQUIRED=true`) |
| 403 | `permission_denied` | Not allowed |
| 404 | `not_found` | Resource missing |
| 409 | `conflict` | State conflict |
| 413 | `payload_too_large` | Body exceeds `MAX_REQUEST_BYTES` |
| 422 | `validation_error` | Schema validation failed |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Unexpected server error |
| 502 | `ai_provider_error` | External AI provider failed or returned unusable output |
| 502 | `github_api_error` | GitHub rejected or failed a read-only request |
| 503 | `not_configured` | Integration requested but not configured |

---

## Planned endpoints (not yet implemented)

The following are **not** available yet — listed so the roadmap is explicit:

```
`POST /api/v1/investigations`, `GET /api/v1/investigations/{id}`,
`POST /api/v1/investigations/{id}/messages`, `GET /api/v1/investigations/{id}/evidence`,
`POST /api/v1/logs/analyze`, `GET /api/v1/metrics/query`,
`GET /api/v1/runbooks`, `GET /api/v1/audit-events`
```

GitHub Actions (`/api/v1/github/*`) and Terraform plan review
(`POST /api/v1/terraform/review`) are implemented; see the sections above.
