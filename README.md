# SRE Copilot

Read-only, evidence-backed diagnosis for Kubernetes, logs, CI/CD, and Terraform.
Ask why a pod is failing or a pipeline broke and get back structured findings that
separate **observed facts** from **hypotheses**, each with citations to the
evidence used.

> **Status: milestones 1–2.5 complete; AI, GitHub Actions, and Terraform plan
> review implemented.** Read-only Kubernetes diagnosis is verified against a
> local Kind cluster and labelled fixtures. GitHub Actions diagnosis is
> read-only and requires a server-side token. Terraform plan review parses plan
> JSON without running Terraform. **Not yet implemented:** Prometheus, log
> analysis, investigation persistence, assistant chat, runbooks, and
> multi-cluster selection. Do not treat anything here as production-ready until
> the security controls in [docs/SECURITY.md](docs/SECURITY.md) are implemented.

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
- **Read-only GitHub Actions diagnosis** (`/api/v1/github/*`): list runs, load
  jobs and steps, and diagnose failures from bounded log excerpts. The `/cicd`
  console shows evidence, read-only next steps, and optional AI explanation.
  Every GitHub request is a `GET`; there is no dispatch, re-run, or cancel path.
- **Terraform plan review** (`POST /api/v1/terraform/review`): detects
  replacements and deletions, replacement paths, attribute-name changes,
  unknown values, and stateful-resource risk; reports blast radius. The
  `/terraform` console accepts pasted or uploaded plan JSON. Attribute values
  are deliberately omitted.
- **AI explanation layer** for Kubernetes and GitHub evidence: deterministic
  findings remain authoritative; only redacted evidence summaries are sent to
  the configured provider. OpenRouter is supported through the
  OpenAI-compatible adapter.
- Self-hosted signup/login with an HttpOnly session cookie and a gated
  `/dashboard`.
- Frontend fetches real health and integration status; demo data is labelled.

## What does **not** work yet

- No Prometheus adapter, log-analysis engine, metrics/timeline correlation, or
  runbook library.
- No investigation/assistant chat persistence API yet.
- Multi-cluster selection is not exposed in the UI; one cluster per backend
  process is supported.
- Anthropic's native Messages API adapter is not implemented.
- Authorization/tenant isolation is not implemented; do not expose the API
  publicly.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the milestone plan.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components and data flow
- [docs/SECURITY.md](docs/SECURITY.md) — threat model, permissions, known risks
- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) — setup and commands
- [docs/API.md](docs/API.md) — endpoints and examples
- [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md) — read-only GitHub token and endpoints
- [docs/TERRAFORM_REVIEW.md](docs/TERRAFORM_REVIEW.md) — plan review and blast radius
- [docs/TESTING.md](docs/TESTING.md) — test commands and expected results
- [docs/ROADMAP.md](docs/ROADMAP.md) — completed / in-progress / future work

## License

See the repository license. This scaffold contains no production secrets; replace
example credentials before deploying anywhere.
