# SRE Copilot

Read-only, evidence-backed diagnosis for Kubernetes, logs, CI/CD, and Terraform.
Ask why a pod is failing or a pipeline broke and get back structured findings that
separate **observed facts** from **hypotheses**, each with citations to the
evidence used.

> **Status: Milestones 1–2 complete.** A tested backend foundation plus
> **read-only Kubernetes diagnosis** (verified in demo/fixture mode; live-cluster
> verification needs a Docker-enabled host). The remaining investigation engines
> (GitHub, Prometheus, Terraform, AI reasoning) are **not yet implemented** — see
> [docs/ROADMAP.md](docs/ROADMAP.md). Do not treat anything here as
> production-ready until the security controls in [docs/SECURITY.md](docs/SECURITY.md)
> are implemented.

## Principles

1. Evidence before conclusions.
2. Read-only access by default.
3. Explain why a diagnosis was reached.
4. Never fabricate logs, metrics, events, or results.
5. Separate observed facts from hypotheses and recommendations.
6. Require explicit human approval before any infrastructure-changing action.
7. Protect credentials, secrets, and customer data.
8. Make investigations reproducible and auditable.
9. Work locally in demo mode with no paid services.
10. Clearly distinguish live integrations from simulated demonstrations.

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI application, SQLAlchemy models, Alembic migrations, tests |
| `frontend/` | Next.js (App Router) UI and typed API client |
| `deploy/` | Docker Compose for local Postgres + backend + frontend |
| `docs/` | Architecture, security, setup, testing and roadmap documents |
| `.github/workflows/ci.yml` | CI: backend lint + tests, frontend lint + build |

## Quick start (demo mode — no credentials)

```bash
# 1. Backend
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
cp ../.env.example .env          # optional; defaults already work
uvicorn app.main:app --reload    # http://localhost:8000

# 2. Frontend (new terminal)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev   # http://localhost:3000
```

The app starts with **no API keys, no cluster, and no cloud account**. The
backend defaults to SQLite and creates its schema automatically for local use.

### Docker Compose

```bash
cp .env.example .env
docker compose -f deploy/docker-compose.yml up --build
```

## What works today

- Versioned API (`/api/v1`) with OpenAPI docs at `/docs`.
- Health, readiness, and liveness endpoints (`/api/v1/health`).
- Integration status endpoint (`/api/v1/integrations`) that reports what is
  configured, and whether it is live, demo, or unconfigured — **without leaking
  secrets**.
- Structured logging with correlation IDs and secret redaction.
- Consistent JSON error envelope and request-size/rate limits.
- Shared **Evidence** model with provenance, redaction, and integrity
  fingerprints.
- SQLAlchemy models + Alembic migrations for users, conversations, messages,
  integrations, investigations, audit events, and evidence.
- **Read-only Kubernetes diagnosis** (`/api/v1/kubernetes/*`): cluster/namespace/
  pod/workload listing, bounded logs, and an evidence-backed pod diagnosis
  (CrashLoopBackOff, OOMKilled, ImagePullBackOff/ErrImagePull, Pending/
  Unschedulable, probe failures). The Kubernetes UI at `/kubernetes` renders the
  diagnosis, its evidence, read-only next steps, and approval-gated remediation.
  Runs against labelled demo fixtures, or a live cluster with read-only RBAC.
- Frontend fetches real health and integration status; demo data is labelled.

## What does **not** work yet

- No GitHub, Prometheus, or Terraform adapters (Modules C–F).
- No AI providers beyond a configured-but-unimplemented `mock` selection
  (Module H). No investigations/chat persistence API yet (Module A/K).
- No log-analysis engine, metrics, timelines, or runbooks.
- No backend authentication/authorization; do not expose the API publicly.
- The AI/`mock` provider is a **selection placeholder**, not a working engine.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the milestone plan.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components and data flow
- [docs/SECURITY.md](docs/SECURITY.md) — threat model, permissions, known risks
- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) — setup and commands
- [docs/API.md](docs/API.md) — endpoints and examples
- [docs/TESTING.md](docs/TESTING.md) — test commands and expected results
- [docs/ROADMAP.md](docs/ROADMAP.md) — completed / in-progress / future work

## License

See the repository license. This scaffold contains no production secrets; replace
example credentials before deploying anywhere.
