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

## Error codes

| HTTP | `code` | Meaning |
|------|--------|---------|
| 400 | `bad_request` | Malformed request |
| 401 | `unauthorized` | Missing/invalid credentials (auth not yet enforced) |
| 403 | `permission_denied` | Not allowed |
| 404 | `not_found` | Resource missing |
| 409 | `conflict` | State conflict |
| 413 | `payload_too_large` | Body exceeds `MAX_REQUEST_BYTES` |
| 422 | `validation_error` | Schema validation failed |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Unexpected server error |
| 503 | `not_configured` | Integration requested but not configured |

---

## Planned endpoints (not yet implemented)

The following are **not** available yet — listed so the roadmap is explicit:

```
`POST /api/v1/investigations`, `GET /api/v1/investigations/{id}`,
`POST /api/v1/investigations/{id}/messages`, `GET /api/v1/investigations/{id}/evidence`,
`GET /api/v1/github/*`, `POST /api/v1/logs/analyze`,
`POST /api/v1/terraform/review`, `GET /api/v1/metrics/query`,
`GET /api/v1/runbooks`, `GET /api/v1/audit-events`
```
