# Architecture

> Scope note: this document describes **what exists in the repository today**
> and marks the intended shape of later milestones when relevant. Diagrams
> include planned components only where explicitly labelled.

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

Planned (not yet implemented):
  backend/app/adapters/prometheus/*  → Metrics (read-only)
  backend/app/services/*             → log analysis, timeline, runbooks

Implemented:
  backend/app/adapters/kubernetes/*  → read-only Kubernetes diagnosis
  backend/app/adapters/github/*      → read-only GitHub Actions runs/jobs/logs
  backend/app/ai/*                   → provider-independent AI explanation
  backend/app/services/terraform_review.py → plan parsing and blast radius
```

## Backend

- **Entry point** — `app/main.py` builds the FastAPI app, installs middleware,
  and mounts the versioned router at `/api/v1`.
- **Configuration** — `app/core/config.py` (`Settings`, cached). Every
  integration is disabled by default. `demo_mode` is a derived property.
- **Cross-cutting concerns**
  - `app/core/logging.py` — structured (plain or JSON) logs with redaction.
  - `app/core/request_context.py` — per-request correlation ID (`X-Request-ID`).
  - `app/core/errors.py` — `AppError` hierarchy and a single JSON error envelope.
  - `app/core/ratelimit.py` — in-memory rate limiter + body-size guard.
  - `app/core/redaction.py` — best-effort credential redaction.
- **Schemas** — `app/schemas/*` are the typed API contracts. `evidence.py` and
  `investigation.py` define the shared evidence + diagnosis vocabulary that
  later modules populate.
- **Services** — `app/services/evidence.py` (evidence construction),
  `app/services/integrations.py` (configuration status), `app/services/audit.py`
  (redacted audit records), `app/services/kubernetes_diagnosis.py`,
  `app/services/github_diagnosis.py`, `app/services/terraform_review.py`, and
  `app/services/ai.py` (optional model explanation).
- **Persistence** — `app/db/models.py` (SQLAlchemy 2.0 typed models),
  `app/db/session.py` (engine/session), Alembic migrations under
  `alembic/versions/`.

### Data flow (current)

```
HTTP request
  → RequestContextMiddleware (assign X-Request-ID)
  → CORS → RateLimit → MaxBodySize
  → router → schema validation → (service) → SQLAlchemy session
  → response (or JSON error envelope)
```

## Evidence model

`Evidence` is the unit of truth. Each record has:

- `id`, optional `investigation_id`
- `source_type` (kubernetes/github/logs/terraform/prometheus/user/ai/system)
- `source_resource`, `environment`
- `timestamp` (event time) and `collected_at` (collection time)
- `severity`, `summary`, redacted `payload`
- `provenance`, `related_ids`
- `integrity` — sha256 over the redacted payload + key fields
- `redacted` and `demo` flags

`demo=true` marks fixture-derived evidence so the UI can label it. Diagnoses
cite evidence by ID instead of restating it.

## Frontend

- Next.js App Router; the marketing site is static.
- `lib/api.ts` is the single typed API client (base URL, error unwrapping).
- `lib/auth.ts` toggles Clerk. **Clerk is optional**: with no publishable key the
  app runs with a self-hosted signup/login flow and no third-party credentials.
- `lib/auth-client.tsx` mirrors the signed-in user for the UI (identity only —
  the session token lives in an `HttpOnly` cookie). `components/AuthForm.tsx` +
  `app/login`, `app/sign-up`, and the gated `app/dashboard` implement the flow;
  `lib/api.ts` sends the cookie with `credentials: "include"`.
- `components/StatusStrip.tsx` and `components/HealthPill.tsx` render live
  backend status; demo data is explicitly labelled.
- Product consoles: `/kubernetes` (pod diagnosis), `/cicd` (read-only GitHub
  Actions runs/jobs/diagnosis), and `/terraform` (plan blast-radius review).
  Each renders cited evidence and keeps state-changing remediation
  approval-gated or out of scope.

## Configuration & environments

| Setting | Local default | Notes |
|---------|---------------|-------|
| `DATABASE_URL` | `sqlite:///./sre_copilot.db` | Postgres in Compose |
| `AUTO_CREATE_SCHEMA` | `true` | Local SQLite only; never Postgres |
| `AI_PROVIDER` | `mock` | `openai`/`anthropic` require keys |
| `AI_PRIVACY_MODE` | `false` | Blocks external LLM transmission |
| `GITHUB_ENABLED` / `GITHUB_TOKEN` | `false` / empty | Read-only Actions access |
| `*_ENABLED` integrations | `false` | All off by default |
| Terraform review | no config | Parses supplied plan JSON only |

## Design constraints

- Integrations live behind service interfaces so tests can substitute mock
  adapters without confusing mocks with real data.
- No new infrastructure (Redis/Kafka) is introduced for appearance.
- Migrations are the source of truth for schema in non-local environments.
