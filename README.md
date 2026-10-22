# SRE Copilot

Read-only, evidence-backed diagnosis for Kubernetes, logs, CI/CD, Terraform, and
Prometheus. Ask why a pod is failing or a pipeline broke and get back structured
findings that separate **observed facts** from **hypotheses**, each with citations
to the evidence used.

> **Status: all planned vertical slices are implemented in the working tree.**
> The product includes log analysis, investigations/assistant chat, audit and
> settings, Prometheus queries and correlation, multi-cluster Kubernetes, a
> runbook library, proposal-only infrastructure-code generation, Terraform AI
> explanations, Anthropic's native Messages API, and admin/tenant controls.
> Everything infrastructure-facing is **read-only** or a human-approved proposal.
> See [BUILD_STATUS.md](BUILD_STATUS.md) for the exact verification state and
> remaining release blockers.

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
| `docs/` | Architecture, security, setup, testing, release, and roadmap docs |
| `.github/workflows/ci.yml` | CI: backend lint + tests, frontend lint/build + route smoke |

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
New registrations are members. After creating your account, grant administrator
access only from a trusted backend shell with
`cd backend; python scripts/set_admin.py your-email@example.com`. Use
`--member` to revoke an existing admin role after confirming the target.

### Docker Compose

```bash
cp .env.example .env
docker compose -f deploy/docker-compose.yml up --build
```

## What works today

- Versioned API (`/api/v1`) with OpenAPI docs at `/docs`, health/readiness, and
  integration status that never returns secrets.
- Structured logging, request IDs, redaction, consistent JSON errors, request
  size limits, rate limiting, and response security headers.
- Shared **Evidence** model with provenance, redaction, integrity fingerprints,
  and `demo` labels.
- Self-hosted accounts, server-side sessions, `admin`/`member` roles, tenant
  scoping, per-user settings, revocable API keys, and an admin user/tenant API.
  Public signup never grants administrator privileges. Production always
  requires auth.
- **Customer dashboard**: authenticated overview, quick starts, recent saved
  investigations, responsive workspace sidebar, and personal account settings.
  Admin operational settings remain at `/admin/settings`.
- **Plan entitlements**: centrally configured in
  `frontend/lib/feature-access.ts`; Free currently includes every feature.
- **Kubernetes**: read-only multi-cluster selection, namespace/pod/workload
  listing, bounded logs, and evidence-backed diagnosis for CrashLoopBackOff,
  OOMKilled, ImagePullBackOff, Pending, probe failures, and related signals.
- **GitHub Actions**: read-only runs/jobs/steps/logs and deterministic failure
  diagnosis. Every request is a `GET`; no dispatch, re-run, or cancel path.
- **Terraform**: plan review (replacements, deletions, blast radius, stateful
  risk) with values omitted, plus an optional AI explanation.
- **Logs**: signature grouping/deduplication, severity, timestamps, stack frames,
  redaction, evidence, and a live `/logs` console.
- **Prometheus**: read-only query/query-range adapter, labelled fixtures, z-score
  timing correlation, evidence, and a live `/metrics` console.
- **Assistant**: persisted investigations, message history, evidence, and AI
  exchanges at `/assistant`.
- **Audit and settings**: filters, CSV export, admin-only retention, per-tenant
  privacy/retention policy, and admin user/tenant management.
- **Runbooks**: searchable read-only operator sequences with guardrails at
  `/runbooks`.
- **Infrastructure code**: deterministic Kubernetes Deployment/Service and
  Terraform module proposals with baseline policy findings at `/infra-code`.
  Nothing is written or applied.
- **AI providers**: deterministic mock, OpenAI-compatible APIs including Groq,
  OpenRouter, and native Anthropic Messages API. Deterministic diagnosis remains
  authoritative. Configure `GROQ_API_KEY` server-side; never expose it in the
  frontend.
- Paper/ink route-group themes, semantic utilities, 4px corners, and a
  reduced-motion-safe motion system.

## Security boundary

- Kubernetes, GitHub, Terraform, Prometheus, and infrastructure-code paths are
  read-only or proposal-only.
- AI keys and integration credentials stay in the backend environment. Only
  redacted evidence summaries and the question leave the server; privacy mode
  blocks external providers.
- `AUTH_REQUIRED` is off by default for the local demo, but production always
  requires authentication. Shared deployments should set it explicitly and use
  HTTPS.
- The last active admin cannot be demoted or deactivated; deactivating an
  account revokes its sessions.
- Do not expose the API publicly until the hardening and release items in
  [docs/SECURITY.md](docs/SECURITY.md) and [docs/RELEASE.md](docs/RELEASE.md) are
  complete.

## Customer account API

Authenticated account data is scoped to the current user under `/api/v1/account`:
profile, password, preferences, integration enablement flags, API key create
and revoke, and account deletion. API key secrets are displayed once and stored
as hashes. Live integration credentials remain operator-managed in backend
environment variables. The admin workspace configuration page is `/admin/settings`.

## Changelog

- Added an authenticated dashboard workspace with responsive navigation,
  account overview, recent investigations, history, and planned-feature pages.
- Added centralized Free/Pro/Team entitlements. Free currently unlocks all
  features; no payment or billing is implemented.
- Added persistent per-user profile, password, preferences, integration flags,
  API key, and account-deletion endpoints and settings forms.
- **Backend security fix — privilege escalation during registration:** public
  signup previously made the first registrant an administrator and promoted a
  matching `BOOTSTRAP_ADMIN_EMAIL` without verifying ownership. Removed
  first-user and email-based admin promotion from signup, startup, local schema
  upgrades, and fresh role migrations (`backend/app/services/auth.py`,
  `backend/app/main.py`, `backend/app/db/local_schema.py`, and
  `backend/alembic/versions/0005_roles_tenants.py`). New accounts are members;
  administrators are provisioned through the trusted
  `backend/scripts/set_admin.py` command. Existing installations should review
  administrator roles assigned by older versions and demote any account that
  was not deliberately authorized.
- Added hashed, owner-scoped API keys, account settings migrations, and route
  tests covering persistence, ownership, password checks, revocation, and the
  signup privilege boundary.
- Preserved existing admin operational settings at `/admin/settings` while
  using `/settings` for customer account settings.
- Added Groq support through the existing OpenAI-compatible chat completions
  adapter using server-side `GROQ_API_KEY`/`GROQ_BASE_URL`; no SDK dependency
  was added.
- Removed the Customers dropdown and its links from the marketing navbar.

## Verification

```bash
# Backend
cd backend
.venv/bin/ruff check app tests
.venv/bin/pytest -q

# Frontend
cd frontend
npm run lint
npm run build
npm run start &
npm run smoke      # dependency-free route smoke against http://localhost:3000
```

See [docs/TESTING.md](docs/TESTING.md) for coverage and known limits.

## Documentation

- [BUILD_STATUS.md](BUILD_STATUS.md) — completed, bounded, and remaining work
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components and data flow
- [docs/SECURITY.md](docs/SECURITY.md) — threat model, controls, known risks
- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) — setup and commands
- [docs/API.md](docs/API.md) — endpoints and examples
- [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md) — read-only GitHub token and endpoints
- [docs/KUBERNETES_SETUP.md](docs/KUBERNETES_SETUP.md) — single and multi-cluster setup
- [docs/TERRAFORM_REVIEW.md](docs/TERRAFORM_REVIEW.md) — plan review and blast radius
- [docs/PROMETHEUS_SETUP.md](docs/PROMETHEUS_SETUP.md) — metrics and correlation
- [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) — provider configuration and privacy
- [docs/TESTING.md](docs/TESTING.md) — test commands, coverage, and limits
- [docs/RELEASE.md](docs/RELEASE.md) — release and Windows sync checklist
- [docs/ROADMAP.md](docs/ROADMAP.md) — milestone history and future work

## License

See the repository license. This scaffold contains no production secrets; replace
example credentials before deploying anywhere.
