# Build status

Last updated: GitHub Actions read-only diagnosis + Terraform plan review.

## Design system: paper + ink (2026-10-21)

- Three route groups now own the theme: `(marketing)` and `(auth)` use
  `data-theme="paper"`; `(product)` uses `data-theme="ink"`. The root layout sets
  no theme.
- Root layout loads Geist, Geist Mono, and Instrument Serif and wraps the local
  `AuthProvider`. It has no nav, footer, or Clerk provider.
- `TopNav` is theme-neutral and works on both canvases. `MarketingFooter` and
  `AuthHeader` are new.
- All marketing pages were rewritten in paper mode with editorial type, hairline
  borders, square controls, and honest empty states.
- Login and sign-up now use a paper-mode local `AuthForm`. Clerk imports were
  removed everywhere; the package remains installed but unused.
- Product pages were moved unchanged under `(product)`. They inherit the ink
  wrapper but still use legacy palette classes, so they render incorrectly. This
  is expected and is the next sweep.
- `docs/DESIGN_SYSTEM.md` documents the modes, tokens, semantic utilities, and
  the no-literal-colors rule.

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
- **AI explanation layer** (`app/ai/providers/*`, `app/services/ai.py`,
  `app/api/v1/ai.py`): provider-independent interface, deterministic mock,
  OpenAI-compatible adapter, OpenRouter support, strict validated JSON output,
  privacy-mode enforcement, and `POST /api/v1/ai/{diagnose,summarize}`. Evidence
  summaries are redacted before transmission; remediation is never executed.
- **GitHub Actions read-only diagnosis** (`app/adapters/github/*`,
  `app/services/github_diagnosis.py`, `app/api/v1/github.py`): structurally
  read-only client, normalized runs/jobs/steps, bounded log excerpts,
  deterministic failure rules, evidence, and `GET /api/v1/github/*` +
  `POST /api/v1/github/runs/{id}/diagnose`. The token is stripped on cross-host
  log-download redirects.
- **Terraform plan review** (`app/services/terraform_review.py`,
  `app/api/v1/terraform.py`): parses `terraform show -json`, detects
  replacements/deletions, replacement paths, attribute-name changes, unknown
  values, and stateful-resource risk; classifies blast radius and returns
  findings/evidence. Attribute values are omitted.
- Local SQLite databases from an older milestone are upgraded additively on
  startup (`app/db/local_schema.py`), since `create_all()` cannot add columns.
- Tests: **138 passing** (`pytest`); lint clean (`ruff check .`).

## Frontend

- Next.js App Router site (static marketing pages).
- Typed API client (`lib/api.ts`); live health + integration status.
- **Kubernetes console** (`/kubernetes`): namespace filter, pod list, and an
  evidence-backed diagnosis view with read-only next steps and approval-gated
  remediation. An optional "Explain with AI" panel calls the backend with the
  cited evidence summaries and labels the result as model-generated.
- **GitHub Actions console** (`/cicd`): repository/branch lookup, run list, job
  and step inspection, deterministic failure diagnosis, evidence, and optional
  AI explanation. Shows a setup notice when the integration is not configured.
- **Terraform plan console** (`/terraform`): paste or upload plan JSON, load an
  illustrative sample, and review blast radius, findings, resource changes, and
  evidence. Attribute values are not displayed.
- **Auth pages + dashboard** (`/sign-up`, `/login`, `/dashboard`): self-hosted
  signup/login with an HttpOnly session cookie; the dashboard is gated and shows
  live integration status plus quick links to each diagnosis surface.
- Auth is local only. The Clerk package remains installed in `package.json`, but
  no file imports it.
- Lint and production build pass (31 routes).

## Deployment

- Backend Dockerfile: non-root, runs migrations then serves, has a healthcheck.
- Frontend Dockerfile: `npm ci`, build-time `NEXT_PUBLIC_*` args.
- Docker Compose: Postgres + backend + frontend.

## Not yet implemented

Prometheus adapter; Anthropic's native provider; investigation/assistant
persistence, log analysis, metrics/timeline correlation, runbooks, and
multi-cluster selection; authorization and tenant isolation (API-wide auth is
off by default). Live Kubernetes was verified against a local kind cluster on
the user's Windows host. GitHub requires a server-side token in the user's
environment; the code path is covered by mocked clients in CI. See
`docs/ROADMAP.md`.
