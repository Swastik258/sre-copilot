# Build status

Last updated: Milestone 2.5 (self-hosted accounts & dashboard).

## Backend

- FastAPI application with versioned API (`/api/v1`).
- Health, readiness and liveness endpoints (real database check).
- Integration status endpoint (configuration state; no secrets).
- Structured logging with request IDs and secret redaction.
- Consistent JSON error envelope.
- Request-size limit and optional in-memory rate limiting.
- Shared Evidence schema + SQLAlchemy/Evidence model + Alembic migration.
- Audit service.
- **Read-only Kubernetes diagnosis** (`app/adapters/kubernetes/*`,
  `app/services/kubernetes_diagnosis.py`, `app/api/v1/kubernetes.py`): normalized
  models, a structurally read-only client interface, a real client (lazy import)
  and a fixture client, deterministic rules, and evidence-backed diagnoses.
- **Self-hosted accounts** (`app/api/v1/auth.py`, `app/services/auth.py`,
  `app/security/*`): signup/login/logout/me, scrypt-hashed passwords, and
  server-side sessions in an HttpOnly cookie. API-wide enforcement is available
  via `AUTH_REQUIRED` (off by default).
- Local SQLite databases from an older milestone are upgraded additively on
  startup (`app/db/local_schema.py`), since `create_all()` cannot add columns.
- Tests: **82 passing** (`pytest`); lint clean (`ruff check .`).

## Frontend

- Next.js App Router site (static marketing pages).
- Typed API client (`lib/api.ts`); live health + integration status.
- **Kubernetes console** (`/kubernetes`): namespace filter, pod list, and an
  evidence-backed diagnosis view with read-only next steps and approval-gated
  remediation.
- **Auth pages + dashboard** (`/sign-up`, `/login`, `/dashboard`): self-hosted
  signup/login with an HttpOnly session cookie; the dashboard is gated and shows
  live integration status plus quick links to each diagnosis surface.
- Clerk is optional; without keys the app uses the local auth pages and boots in
  demo mode with no third-party credentials.
- Lint and production build pass (31 routes).

## Deployment

- Backend Dockerfile: non-root, runs migrations then serves, has a healthcheck.
- Frontend Dockerfile: `npm ci`, build-time `NEXT_PUBLIC_*` args.
- Docker Compose: Postgres + backend + frontend.

## Not yet implemented

GitHub / Prometheus / Terraform adapters; AI providers; the investigation,
log-analysis, metrics, timeline and runbook modules; authorization and tenant
isolation (API-wide auth is off by default).
Live Kubernetes verification needs a Docker-enabled host. See `docs/ROADMAP.md`.
