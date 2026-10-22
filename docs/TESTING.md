# Testing and quality gates

Tests are deterministic and require **no production credentials** and **no
network access**. External systems are represented by fixtures, mock adapters,
or dependency audits run separately in CI. Browser end-to-end coverage is not
included yet.

> **Current status (2026-10-22).** 266 backend tests pass. Backend line+branch
> coverage is gated at 80% over `backend/app` and currently measures **82.9%**
> with 293 partial/missed branches. `ruff` lint and format, `mypy`, `bandit`,
> `pip-audit`, frontend lint/type-check/build, and `npm audit` pass locally.

## Backend

```bash
cd backend
. .venv/bin/activate
ruff check app tests
ruff format --check app tests
mypy app
pytest --cov=app --cov-branch --cov-report=term-missing --cov-fail-under=80
bandit -q -c pyproject.toml -r app
pip-audit --progress-spinner off
```

### What is covered

| Area | Test file |
|------|-----------|
| Health / readiness / liveness, request IDs | `tests/unit/test_health.py` |
| Secret redaction (keys, JWTs, PEM, URIs, kv) | `tests/unit/test_redaction.py` |
| Configuration + production safety validation | `tests/unit/test_config.py` |
| Error envelope (validation / app / http / unhandled) | `tests/unit/test_errors.py` |
| Evidence construction, redaction, integrity | `tests/unit/test_evidence.py` |
| Rate-limit and body-size middleware | `tests/unit/test_ratelimit.py` |
| Prompt boundary escaping and untrusted evidence | `tests/unit/test_prompt_boundaries.py` |
| Idempotency replay, conflicts, and scope hashing | `tests/integration/test_idempotency.py` |
| Durable jobs, retries, encryption, stale recovery | `tests/integration/test_jobs.py` |
| Argon2id plus legacy scrypt/PBKDF2 verification | `tests/unit/test_passwords.py` |
| Password policy | `tests/unit/test_password_policy.py` |
| SMTP, console, disabled, and failed delivery modes | `tests/unit/test_email_delivery.py` |
| OAuth state, callback linking, profiles, transport errors | `tests/unit/test_oauth_service.py`, `tests/integration/test_oauth.py` |
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
| Kubernetes API, fixtures, pagination, validation | `tests/integration/test_kubernetes_api.py` |
| GitHub API (disabled, detail, diagnosis, validation) | `tests/integration/test_github_api.py` |
| Terraform API (review, malformed plans, missing body) | `tests/integration/test_terraform_api.py` |
| Log analysis API | `tests/integration/test_logs_api.py` |
| Metrics query/correlation API | `tests/integration/test_metrics_api.py` |
| Runbooks, infra generation, Terraform explain | `tests/integration/test_runbooks_infra_api.py` |
| Investigations, messages, evidence, tenant scoping | `tests/integration/test_investigations_api.py` |
| Account settings, integrations, API-key isolation | `tests/integration/test_account_settings_api.py` |
| Audit/settings API, retention, tenant policy | `tests/integration/test_audit_settings_api.py` |
| Roles, tenant moves, session revocation, security headers | `tests/integration/test_admin_tenancy.py` |
| Last-admin guard, tenant migration, bootstrap promotion | `tests/integration/test_admin_service.py` |
| Auth flows, CSRF, lockout, recovery, `AUTH_REQUIRED` gate | `tests/integration/test_auth.py` |
| Organizations, invitations, roles, workspace switching | `tests/integration/test_organizations.py` |
| Billing entitlements, usage, webhook handling | `tests/integration/test_billing.py` |
| Persistence + cascade deletion | `tests/integration/test_db_persistence.py` |
| Audit redaction | `tests/integration/test_audit.py` |
| Real Alembic migration creates tables/columns | `tests/integration/test_migrations.py` |

The migration test runs `alembic upgrade head` in a subprocess against a
temporary SQLite database and checks the expected tables and role/tenant columns;
it also exercises upgrade from earlier revisions, backfills, and the latest
downgrade/upgrade path. It exercises the real migration path, not
`Base.metadata.create_all`.

## Pre-commit

Install the hook once after creating the backend virtualenv:

```bash
cd backend
pip install -e ".[dev]"
cd ..
pre-commit install
pre-commit run --all-files
```

The hook runs whitespace/secret checks, Ruff lint+format, mypy, and Bandit. It
assumes the backend virtualenv is active so `python -m mypy` and
`python -m bandit` resolve. Full tests, coverage, dependency audits, and the
frontend build remain CI/pre-push responsibilities because they are slower.

## Frontend

```bash
cd frontend
npm run lint      # eslint
npm run typecheck # tsc --noEmit
npm audit --omit=dev --audit-level=high
npm run build     # production build
```

The production build currently has **40 routes**.

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
  current gate is backend tests + frontend lint/type-check/build + HTTP route
  smoke. Perform the manual browser pass in `docs/RELEASE.md` before a release.
- **Optional OpenTelemetry/Sentry exporter integration** — the SDK/exporter
  packages are an optional extra, and no live collector is contacted in tests.
- **Kubernetes adapter tests against a live cluster** — require Docker; rules and
  read-only structure are covered by fixtures. Live verification was performed
  manually against a local Kind cluster.
- **GitHub adapter tests against the live API** — require a fresh read-only token
  and network. Adapter/rules are covered by mocked clients.
- **Live AI provider checks** — require rotated provider keys and network.
- **SMTP and OAuth provider calls** — mocked; live verification requires rotated
  credentials and explicit approval.
- **Prometheus live checks** — require a reachable Prometheus URL; fixture mode
  is covered by tests.

Coverage is a floor, not a correctness proof. Review branch coverage for
authorization and destructive paths when changing them.

## Continuous integration

`.github/workflows/ci.yml` runs, on every push and pull request:

- Backend: install `.[dev]`, `ruff check`, `ruff format --check`, `mypy`,
  `pytest` with branch coverage and an 80% floor, `bandit`, and `pip-audit`.
- Frontend: `npm ci`, `npm run lint`, `npm run typecheck`, `npm audit`, build,
  then start the production server and run the route smoke.

CI never requires real credentials.
