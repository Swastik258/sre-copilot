# SRE Copilot

Read-only, evidence-backed diagnosis for Kubernetes, logs, CI/CD, Terraform, and
Prometheus. Ask why a pod is failing or a pipeline broke and get back structured
findings that separate **observed facts** from **hypotheses**, each with citations
to the evidence used.

> **Status: production-readiness work is on `chore/production-readiness`.**
> The visual baseline is `master` at `85ef4d9`. Every live product surface is
> available in Free; Pro and Team are explicitly planned, unpriced, and not for
> sale. Infrastructure-facing paths are read-only or proposal-only. See
> [BUILD_STATUS.md](BUILD_STATUS.md) for verification state and release blockers.

## Principles

1. Evidence before conclusions.
2. Read-only access by default.
3. Explain why a diagnosis was reached.
4. Never fabricate logs, metrics, events, results, customers, or status.
5. Separate observed facts from hypotheses and recommendations.
6. Never change infrastructure; generated changes are proposals only.
7. Protect credentials, secrets, and customer data.
8. Make investigations reproducible and auditable.
9. Work locally in demo mode with no paid services.
10. Clearly distinguish live integrations from labelled demonstrations.

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI application, SQLAlchemy models, Alembic migrations, tests |
| `frontend/` | Next.js (App Router) UI and typed API client |
| `deploy/` | Local production-style Compose, Helm chart, Terraform wrapper, backups |
| `docs/` | Architecture, security, deployment, testing, release, and roadmap docs |
| `.github/workflows/` | CI, approved image release, deploy, and rollback workflows |

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
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 \
NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
npm run dev                      # http://localhost:3000
```

The app starts with **no API keys, no cluster, and no cloud account**. The
backend defaults to SQLite and creates its schema automatically for local use.
Public signup creates an account with its own personal workspace; that account is
the owner of its workspace, not a global administrator. A configured non-default
`DEFAULT_TENANT_ID` creates a shared `member` workspace instead. Admin APIs are
always scoped to the active workspace. For trusted operator provisioning in a
shared deployment, use `backend/scripts/set_admin.py` from a backend shell.

### Docker Compose

```bash
cp .env.example .env
docker compose --env-file .env -f deploy/docker-compose.yml up --build
```

The local stack includes PostgreSQL, the backend, and the frontend. The production
Compose file runs only the app containers and expects an external PostgreSQL
database. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for images, Helm,
Terraform, secrets, migration jobs, rollback, and release promotion.

## What works today

- Versioned API (`/api/v1`) with OpenAPI docs at `/docs`, health/readiness, and
  integration status that never returns secrets.
- Structured logs with request IDs, redaction, consistent JSON errors, request
  size limits, trusted-proxy rate limiting, idempotency, and security headers.
- Shared **Evidence** model with provenance, redaction, integrity fingerprints,
  and `demo` labels.
- Self-hosted accounts, Argon2id passwords, CSRF, sessions with idle/absolute
  expiry, lockout, recovery, email verification, revocable API keys, account
  deletion, and owner/admin/member/viewer roles.
- **Product dashboard**: authenticated overview, quick starts, recent saved
  investigations, live Kubernetes/integration state, responsive workspace shell,
  history, customer settings, and `/admin/settings` for workspace operators.
- **Plan entitlements**: centrally configured in
  `frontend/lib/feature-access.ts`; Free includes every live feature, and billing
  is disabled.
- **Kubernetes**: read-only multi-cluster selection, namespace/pod/workload
  listing, bounded logs, and evidence-backed diagnosis for CrashLoopBackOff,
  OOMKilled, ImagePullBackOff, Pending, probe failures, and related signals.
- **GitHub Actions**: read-only runs/jobs/steps/logs and deterministic failure
  diagnosis. Every request is a `GET`; no dispatch, re-run, or cancel path.
- **Terraform**: plan review (replacements, deletions, blast radius, stateful
  risk) with values omitted, plus an optional AI explanation.
- **Logs**: signature grouping/deduplication, severity, timestamps, stack frames,
  redaction, evidence, and a live `/logs` console. Raw analyzed text is not
  persisted.
- **Prometheus**: read-only query/query-range adapter, labelled fixtures, z-score
  timing correlation, evidence, and a live `/metrics` console.
- **Assistant**: persisted investigations, message history, evidence, and AI
  exchanges at `/assistant`.
- **Audit and settings**: filters, CSV export, workspace-scoped retention,
  per-tenant privacy/retention policy, and workspace user management.
- **Runbooks**: searchable read-only operator sequences with guardrails.
- **Infrastructure code**: deterministic Kubernetes Deployment/Service and
  Terraform module proposals with baseline policy findings. Nothing is written or
  applied.
- **AI providers**: deterministic mock, OpenAI-compatible APIs including Groq,
  OpenRouter, and native Anthropic Messages API. Deterministic diagnosis remains
  authoritative. Keys stay server-side.
- **Operations**: Prometheus metrics, optional OpenTelemetry/Sentry export,
  graceful shutdown, PostgreSQL pooling/migrations/indexes, encrypted retrying
  jobs, backup/restore scripts, and refusal of unsafe production combinations.
- Paper/ink route-group themes, semantic utilities, 4px corners, SEO metadata,
  sitemap/robots, accessible error states, and a reduced-motion-safe motion system.

## Security boundary

- Kubernetes, GitHub, Terraform, and Prometheus paths are read-only.
  Infrastructure-code output is a proposal and has no apply path.
- AI keys and integration credentials stay in the backend environment. Only
  redacted evidence summaries and the question leave the server; privacy mode
  blocks external providers.
- Production always requires authentication and rejects unsafe SMTP, jobs, or
  metrics combinations at startup.
- The last active workspace administrator cannot be demoted or deactivated;
  deactivating an account revokes its sessions.
- Review [docs/SECURITY.md](docs/SECURITY.md) and
  [docs/RELEASE.md](docs/RELEASE.md) before exposing a deployment.

## Customer account API

Authenticated account data is scoped to the current user under `/api/v1/account`:
profile, password, preferences, integration enablement flags, API key create and
revoke, and account deletion. API key secrets are displayed once and stored as
hashes. Live integration credentials remain operator-managed in backend
environment variables. Workspace membership is managed through the organizations
API; `/admin/settings` manages roles inside the active workspace.

## Verification

```bash
# Backend
cd backend
.venv/bin/ruff check app tests
.venv/bin/pytest -q

# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build
npm run start &
npm run smoke      # dependency-free smoke against http://localhost:3000
```

See [docs/TESTING.md](docs/TESTING.md) for coverage gates, deployment validation,
and known limits.

## Documentation

- [BUILD_STATUS.md](BUILD_STATUS.md) — completed, bounded, and remaining work
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components and data flow
- [docs/SECURITY.md](docs/SECURITY.md) — threat model, controls, known risks
- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) — setup and commands
- [docs/API.md](docs/API.md) — endpoints and examples
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — images, Compose, Helm, Terraform, rollback
- [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) — logs, metrics, tracing, error tracking
- [docs/AUDIT.md](docs/AUDIT.md) — audit events and retention
- [docs/BILLING.md](docs/BILLING.md) — plan catalog and disabled billing boundary
- [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md) — read-only GitHub token and endpoints
- [docs/KUBERNETES_SETUP.md](docs/KUBERNETES_SETUP.md) — single and multi-cluster setup
- [docs/TERRAFORM_REVIEW.md](docs/TERRAFORM_REVIEW.md) — plan review and blast radius
- [docs/PROMETHEUS_SETUP.md](docs/PROMETHEUS_SETUP.md) — metrics and correlation
- [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) — provider configuration and privacy
- [docs/TESTING.md](docs/TESTING.md) — test commands, coverage, and limits
- [docs/RELEASE.md](docs/RELEASE.md) — release and Windows sync checklist
- [docs/ROADMAP.md](docs/ROADMAP.md) — milestone history and future work

## License

No license file is included in this repository. Deployment, redistribution, or
commercial use requires permission from the repository owner; add an explicit
license before publishing. No secrets are included. Replace every example value
before deploying. Customer references, support addresses, and legal terms must be
supplied and reviewed by the deployment operator before public launch.
