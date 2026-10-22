# Architecture

> Scope note: this document describes **what exists in the repository today**.
> Future work is labelled explicitly.

## Overview

```
┌──────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│  Next.js frontend    │ ───────────────────────▶ │  FastAPI backend         │
│  (App Router, TS)    │ ◀─────────────────────── │  /api/v1                 │
│  typed client:       │                          │                          │
│  lib/api.ts          │                          │  routers → services → db │
└──────────────────────┘                          └───────────┬──────────────┘
                                                              │ SQLAlchemy
                                                     ┌────────▼────────┐
                                                     │ SQLite (local)  │
                                                     │ Postgres (deploy)│
                                                     └─────────────────┘
```

Implemented adapters and services:

```
backend/app/adapters/kubernetes/*  → read-only single/multi-cluster diagnosis
backend/app/adapters/github/*      → read-only GitHub Actions runs/jobs/logs
backend/app/adapters/prometheus/*  → read-only query/query-range
backend/app/services/log_analysis.py     → signature grouping and evidence
backend/app/services/investigations.py   → persisted cases, messages, AI exchange
backend/app/services/metrics.py          → timing correlation
backend/app/services/runbooks.py         → static operator catalog
backend/app/services/infra_code.py       → deterministic code proposals
backend/app/services/terraform_review.py → plan parsing and blast radius
backend/app/ai/*                         → provider-independent AI explanations
```

## Backend

- **Entry point** — `app/main.py` builds the FastAPI app, installs middleware,
  registers exception handlers, and mounts the versioned router at `/api/v1`.
- **Configuration** — `app/core/config.py` (`Settings`, cached). Integrations are
  disabled by default. Production derives a conservative rate limit and always
  requires authentication.
- **Cross-cutting concerns**
  - `app/core/logging.py` — structured (plain or JSON) logs with redaction.
  - `app/core/request_context.py` — per-request correlation ID (`X-Request-ID`).
  - `app/core/errors.py` — `AppError` hierarchy and one JSON error envelope.
  - `app/core/ratelimit.py` — in-memory rate limiter + body-size guard.
  - `app/core/security.py` — response security headers and production HSTS.
  - `app/core/redaction.py` — best-effort credential redaction.
- **Authentication and authorization**
  - `app/services/auth.py` — local accounts, Argon2id hashes, sessions, CSRF,
    recovery, and email verification.
  - `app/api/v1/account.py` — owner-scoped profile/settings and revocable API keys.
  - `app/api/deps.py` — optional/required user, admin dependency, production
    authentication gate.
  - `app/services/admin.py` — workspace-scoped user/tenant administration and
    last-administrator lockout.
  - `app/services/settings_store.py` — per-tenant non-secret preferences.
  - `app/services/jobs.py` — durable, encrypted, retrying background jobs.
  - `app/core/observability.py` — request metrics, tracing hooks, and readiness.
- **Customer workspace** — `frontend/components/WorkspaceLayout.tsx` is the
  authenticated shell; `frontend/lib/feature-access.ts` maps features to plans.
  The Free plan currently includes all features. Account preferences and API
  keys are persisted per user; operator-configured integration secrets remain
  backend-only.
- **Schemas** — `app/schemas/*` are typed API contracts. Shared evidence and
  diagnosis vocabulary lives in `evidence.py` and `investigation.py`.
- **Services** — evidence construction, integration status, audit, Kubernetes,
  GitHub, Terraform, AI, logs, investigations, metrics, runbooks, infra-code,
  admin, and settings.
- **Adapters** — every infrastructure adapter exposes only read methods. The
  Terraform path parses supplied JSON and never runs Terraform.

### Data flow

```
HTTP request
  → RequestContextMiddleware (assign X-Request-ID)
  → SecurityHeaders → CORS → RateLimit → MaxBodySize
  → router → auth/role dependency → schema validation
  → service → SQLAlchemy session / read-only adapter
  → response (or JSON error envelope)
```

## Evidence and tenancy

`Evidence` is the unit of truth. Each record has:

- `id`, optional `investigation_id`
- `source_type` (kubernetes/github/logs/terraform/prometheus/user/ai/system)
- `source_resource`, `environment`
- event timestamp and `collected_at`
- `severity`, `summary`, redacted `payload`
- `provenance`, `related_ids`
- `integrity` — sha256 over redacted payload + key fields
- `redacted` and `demo` flags

`demo=true` marks fixture-derived evidence. Diagnoses cite evidence by ID instead
of restating it.

Investigations, audit events, and settings carry a `tenant_id`. Members and
viewers are restricted to their own investigations and the audit events they
created. Owners and admins can inspect all events and apply retention within
their active workspace; audit reads, exports, and retention never cross a tenant
boundary. Settings are read per tenant and written by owners/admins. Membership
changes do not move investigation ownership between workspaces: records remain
with the workspace where they were created. The owner/admin/member/viewer model
is intentionally simple; finer-grained per-resource policy is future work.

## Frontend

- Next.js App Router; the marketing site is static.
- `lib/api.ts` is the single typed API client (base URL, error unwrapping).
- Authentication is self-hosted. `lib/auth-client.tsx` mirrors the signed-in user
  for the UI; the session token lives only in an `HttpOnly` cookie. `lib/api.ts`
  sends `credentials: "include"` and handles CSRF and error envelopes.
- Clerk is not present in the dependency tree or runtime path.
- Product consoles:
  - `/dashboard` — account and live integration state
  - `/kubernetes` — cluster selector, pod diagnosis, evidence, AI explanation
  - `/cicd` — read-only GitHub Actions runs/jobs/diagnosis
  - `/terraform` — plan review and optional AI explanation
  - `/logs` — log analysis
  - `/assistant` — persisted investigations and chat
  - `/metrics` — Prometheus query and correlation
  - `/runbooks` — searchable operator catalog
  - `/audit` — audit filters, CSV export, admin retention
  - `/admin/settings` — active-workspace policy and user controls
  - `/infra-code` — proposal-only Deployment/Service/Terraform generation
- `components/StatusStrip.tsx` and `components/HealthPill.tsx` render live
  backend status; demo data is labelled.
- Motion uses shared semantic utilities and collapses under
  `prefers-reduced-motion: reduce`.
- `app/robots.ts`, `app/sitemap.ts`, the root metadata, and `NEXT_PUBLIC_SITE_URL`
  provide public SEO metadata. Auth/workspace routes are excluded from indexing.
- Marketing status copy is generated from the same feature mapping used by the
  workspace. Customer logos, testimonials, and operational metrics must not be
  fabricated; labelled fixtures remain allowed.

## Configuration & environments

| Setting | Local default | Notes |
|---------|---------------|-------|
| `DATABASE_URL` | `sqlite:///./sre_copilot.db` | Postgres in Compose |
| `AUTO_CREATE_SCHEMA` | `true` | Local SQLite only; never Postgres |
| `AUTH_REQUIRED` | `false` | Off for local demo; production always enforces |
| `DEFAULT_TENANT_ID` | `default` | `default` gives each signup a personal workspace; a non-default ID creates a shared workspace for new members |
| `RATE_LIMIT_PER_MINUTE` | `0` | `0` disables locally; production defaults to 120 |
| `AI_PROVIDER` | `mock` | `mock`, `openai`, `groq`, `openrouter`, or `anthropic` |
| `GROQ_API_KEY` / `GROQ_BASE_URL` | empty / Groq OpenAI-compatible endpoint | Server-side Groq chat completions |
| `AI_PRIVACY_MODE` | `false` | Blocks external LLM transmission; per-tenant override available |
| `GITHUB_ENABLED` / `GITHUB_TOKEN` | `false` / empty | Read-only Actions access |
| `PROMETHEUS_ENABLED` / `PROMETHEUS_URL` | `false` / empty | Fixture mode when enabled without a URL |
| `KUBERNETES_CLUSTERS` | empty | JSON array of named read-only targets; legacy single-target settings are fallback |
| Terraform review | no config | Parses supplied plan JSON only |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Frontend build-time API origin |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Frontend build-time canonical origin |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | empty | Optional public support address |
| `BACKGROUND_JOBS_ENABLED` | `false` | Required for SMTP delivery and durable outbox work |
| `CREDENTIAL_ENCRYPTION_KEY` | empty | Fernet key for encrypted queued payloads |
| `METRICS_BEARER_TOKEN` | empty | Required unless metrics are explicitly unauthenticated |

## Deployment topology

- **Local**: `deploy/docker-compose.yml` runs PostgreSQL, backend, and frontend.
- **Production Compose**: `deploy/docker-compose.prod.yml` runs only app
  containers and expects an external PostgreSQL database.
- **Kubernetes**: `deploy/helm/sre-copilot` references an existing Secret by
  default, runs migrations in a pre-install/pre-upgrade Job, and starts backend
  replicas without migration races.
- **Terraform**: optional wrapper around the Kubernetes/Helm deployment, not a
  cloud provisioning module. State can contain secrets and needs protected remote
  storage.
- **Release**: GitHub Actions builds non-root images, then uses protected
  environments for deploy/rollback. Approval is enforced only after repository
  operators configure required reviewers.

## Design constraints

- Integrations sit behind service interfaces so tests can substitute fixtures
  without confusing mocks with real data.
- No mutating integration methods, shell execution, or automatic apply path.
- All generated infrastructure code is a proposal; a human must review it.
- No new infrastructure (Redis/Kafka) is introduced for appearance.
- Migrations are the source of truth for schema in non-local environments.
- Local SQLite gets additive upgrades for older databases; non-local
  environments use Alembic.
