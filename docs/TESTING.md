# Testing

Tests are deterministic and require **no production credentials** and **no
network access**. External systems are represented by fixtures and mock adapters.

## Backend

```bash
cd backend
. .venv/bin/activate
ruff check app tests
pytest -q
```

### Current expected result

```
... (180 tests) ...
180 passed
```

`ruff check` → `All checks passed!`

### What is covered

| Area | Test file |
|------|-----------|
| Health / readiness / liveness, request IDs | `tests/unit/test_health.py` |
| Secret redaction (keys, JWTs, PEM, URIs, kv) | `tests/unit/test_redaction.py` |
| Configuration + integration status derivation | `tests/unit/test_config.py` |
| Error envelope (validation / app / http / unhandled) | `tests/unit/test_errors.py` |
| Evidence construction, redaction, integrity | `tests/unit/test_evidence.py` |
| Rate-limit and body-size middleware | `tests/unit/test_ratelimit.py` |
| Kubernetes fixture client | `tests/unit/test_kubernetes_fixture_client.py` |
| Kubernetes deterministic rules + log redaction | `tests/unit/test_kubernetes_diagnosis.py` |
| Kubernetes read-only structural guarantees | `tests/unit/test_kubernetes_readonly.py` |
| Kubernetes multi-cluster parsing/selection | `tests/unit/test_kubernetes_clusters.py` |
| AI provider selection, validation, privacy, citations | `tests/unit/test_ai_service.py` |
| Native Anthropic Messages adapter | `tests/unit/test_anthropic_provider.py` |
| Log signature grouping, stack frames, redaction | `tests/unit/test_log_analysis.py` |
| GitHub read-only adapter, failure rules, token stripping | `tests/unit/test_github_diagnosis.py` |
| Terraform action/risk parsing, blast radius, value non-disclosure | `tests/unit/test_terraform_review.py` |
| Local SQLite additive upgrades | `tests/unit/test_local_schema.py` |
| Projection/status endpoints | `tests/integration/test_api_integrations.py` |
| Kubernetes API, fixtures, validation | `tests/integration/test_kubernetes_api.py` |
| GitHub API (disabled, detail, diagnosis, validation) | `tests/integration/test_github_api.py` |
| Terraform API (review, malformed plans, missing body) | `tests/integration/test_terraform_api.py` |
| Log analysis API | `tests/integration/test_logs_api.py` |
| Metrics query/correlation API | `tests/integration/test_metrics_api.py` |
| Runbooks, infra generation, Terraform explain | `tests/integration/test_runbooks_infra_api.py` |
| Investigations, messages, evidence, tenant scoping | `tests/integration/test_investigations_api.py` |
| Audit/settings API, retention, tenant policy | `tests/integration/test_audit_settings_api.py` |
| Roles, tenant moves, session revocation, security headers | `tests/integration/test_admin_tenancy.py` |
| Last-admin guard, tenant migration, bootstrap promotion | `tests/integration/test_admin_service.py` |
| Auth flows and `AUTH_REQUIRED` gate | `tests/integration/test_auth.py` |
| Persistence + cascade deletion | `tests/integration/test_db_persistence.py` |
| Audit redaction | `tests/integration/test_audit.py` |
| Real Alembic migration creates tables/columns | `tests/integration/test_migrations.py` |

The migration test runs `alembic upgrade head` in a subprocess against a
temporary SQLite database and checks the expected tables and role/tenant columns;
a second migration test seeds users at `0004` and verifies that the earliest is
promoted to admin at head. It exercises the real migration path, not
`Base.metadata.create_all`.

## Frontend

```bash
cd frontend
npm run lint      # eslint
npm run build     # type-check + production build
```

The production build currently has **33 routes**.

### Release route smoke

The project intentionally has no browser test runner dependency. A dependency-free
smoke script uses Node's built-in `fetch` to verify that all product/marketing
routes serve real HTML from the production build:

```bash
cd frontend
npm run build
npm run start &
RELEASE_BASE_URL=http://localhost:3000 npm run smoke
```

It checks 16 routes. CI runs the same step after the build. This is **not** a
substitute for interactive browser E2E; it catches route/build regressions only.

## Tests not yet possible or not automated

- **Full browser E2E** — requires an explicitly approved runner/dependency. The
  current gate is backend tests + frontend lint/build + HTTP route smoke.
  Perform the manual browser pass in `docs/RELEASE.md` before a release.
- **Kubernetes adapter tests against a live cluster** — require Docker; rules and
  read-only structure are covered by fixtures. Live verification was performed
  manually against a local Kind cluster.
- **GitHub adapter tests against the live API** — require a fresh read-only token
  and network. Adapter/rules are covered by mocked clients.
- **Live AI provider checks** — require rotated provider keys and network.
- **Prometheus live checks** — require a reachable Prometheus URL; fixture mode
  is covered by tests.

## Continuous integration

`.github/workflows/ci.yml` runs, on every push and pull request:

- Backend: install `.[dev]`, `ruff check`, `pytest`.
- Frontend: `npm ci`, `npm run lint`, `npm run build`, then start the production
  server and run the route smoke.

CI never requires real credentials.
