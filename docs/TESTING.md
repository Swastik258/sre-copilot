# Testing

Tests are deterministic and require **no production credentials** and **no
network access**. External systems are represented by fixtures and mock adapters.

## Backend

```bash
cd backend
. .venv/bin/activate
pytest            # or: python -m pytest
ruff check .
```

### Current expected result

```
$ pytest
... (138 tests) ...
138 passed
```

`ruff check .` → `All checks passed!`

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
| Kubernetes deterministic rules (per scenario) + log redaction | `tests/unit/test_kubernetes_diagnosis.py` |
| Kubernetes read-only structural guarantees | `tests/unit/test_kubernetes_readonly.py` |
| AI provider selection, validation, privacy, citations | `tests/unit/test_ai_service.py` |
| GitHub read-only adapter, failure rules, redirect token stripping | `tests/unit/test_github_diagnosis.py` |
| Terraform action/risk parsing, blast radius, value non-disclosure | `tests/unit/test_terraform_review.py` |
| Projection/status endpoints | `tests/integration/test_api_integrations.py` |
| Kubernetes API (503 when disabled, demo listing, diagnose, validation) | `tests/integration/test_kubernetes_api.py` |
| GitHub API (disabled, run detail, diagnosis, repo validation) | `tests/integration/test_github_api.py` |
| Terraform API (review, malformed plans, missing body) | `tests/integration/test_terraform_api.py` |
| Persistence + cascade deletion | `tests/integration/test_db_persistence.py` |
| Audit redaction | `tests/integration/test_audit.py` |
| **Real Alembic migration** creates all tables | `tests/integration/test_migrations.py` |

The migration test runs `alembic upgrade head` in a subprocess against a
temporary SQLite database and asserts the expected tables exist — it exercises
the real migration path, not `Base.metadata.create_all`.

### Tests not yet possible here

- **Kubernetes adapter tests against a live cluster** — require Docker; the
  adapter and deterministic rules are covered by the fixture client and
  structural read-only tests. Planned: `kind`/`minikube` integration tests on a
  Docker-enabled host.
- **GitHub adapter tests against the live API** — require a token and network;
  the adapter and diagnosis rules are covered by mocked clients. The live UI
  requires `GITHUB_ENABLED=true` and a read-only token in the backend `.env`.
- **Frontend component/E2E tests** — no test runner is configured yet; the
  frontend is currently validated by `eslint` and `next build`.

## Frontend

```bash
cd frontend
npm run lint      # eslint
npm run build     # type-check + production build
```

## Continuous integration

`.github/workflows/ci.yml` runs, on every push and pull request:

- Backend: install `.[dev]`, `ruff check`, `pytest`.
- Frontend: `npm ci`, `npm run lint`, `npm run build`.

CI never requires real credentials.
