# Build status

Last updated: Milestone 2 (read-only Kubernetes diagnosis).

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
- Tests: **67 passing** (`pytest`); lint clean (`ruff check .`).

## Frontend

- Next.js App Router site (static marketing pages).
- Typed API client (`lib/api.ts`); live health + integration status.
- **Kubernetes console** (`/kubernetes`): namespace filter, pod list, and an
  evidence-backed diagnosis view with read-only next steps and approval-gated
  remediation.
- Clerk is optional; the app boots in demo mode with no keys.
- Lint and production build pass.

## Deployment

- Backend Dockerfile: non-root, runs migrations then serves, has a healthcheck.
- Frontend Dockerfile: `npm ci`, build-time `NEXT_PUBLIC_*` args.
- Docker Compose: Postgres + backend + frontend.

## Not yet implemented

GitHub / Prometheus / Terraform adapters; AI providers; the investigation,
log-analysis, metrics, timeline and runbook modules; backend authentication.
Live Kubernetes verification needs a Docker-enabled host. See `docs/ROADMAP.md`.
