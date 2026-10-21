# Build status

Last updated: **2026-10-21**
Current baseline: `master` at `e9b0966`; the work below is uncommitted.

This is the concise source of truth for what is implemented, what is deliberately
bounded, and what remains. The milestone view lives in
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Completed

### Product UI and dashboard

- Paper/ink route-group themes are in place: `(marketing)` and `(auth)` use
  paper, `(product)` uses ink, and the root layout sets no theme.
- Semantic utilities, 4px corners, and the shared motion system are used
  throughout. Motion collapses under `prefers-reduced-motion: reduce`.
- `/dashboard` is auth-gated and shows live integration status, surface cards,
  account state, and investigations.
- Navigation is auth-aware on desktop and mobile.
- Live consoles: `/kubernetes`, `/cicd`, `/terraform`, `/logs`, `/assistant`,
  `/metrics`, `/runbooks`, `/audit`, `/settings`, and `/infra-code`.
- `/settings` includes admin-only user, role, tenant, and activation controls.
  `/audit` hides destructive retention actions from members.

### Backend platform

- FastAPI application with a versioned API (`/api/v1`).
- Health, readiness, and liveness endpoints with a real database check.
- Integration status endpoint that reports configured/live/demo/off state
  without returning secrets.
- Structured logging, request IDs, secret redaction, consistent JSON errors,
  request-size limits, optional in-memory rate limiting, and response security
  headers. Production gets a conservative 120 req/min default and always
  requires authentication.
- Shared Evidence schema, SQLAlchemy model, and Alembic migrations.
- Self-hosted accounts: signup/login/logout/me, scrypt password hashing, and
  server-side sessions in an `HttpOnly` cookie.
- Workspace authorization: `admin` and `member` roles; the first local account
  becomes an admin, and `BOOTSTRAP_ADMIN_EMAIL` can promote a specific account.
  Admin APIs list users/tenants and change role, tenant, or activation. The last
  active admin cannot be demoted or deactivated, and deactivation revokes the
  user's sessions.
- Tenant boundaries: investigations carry a tenant, members only see their own
  records, admins can inspect across tenants, and settings are per-tenant.
  Moving a member migrates their investigations to the new tenant. Existing
  databases promote their earliest account to admin during upgrade.
- Audit service and `AuditEvent` model with tenant scoping, read/filter/export,
  and admin-only retention (currently workspace-wide across tenants).
- Local SQLite databases from older milestones are upgraded additively on
  startup through `app/db/local_schema.py`.

### Read-only integrations

- **Kubernetes diagnosis** (`app/adapters/kubernetes/*`,
  `app/services/kubernetes_diagnosis.py`, `app/api/v1/kubernetes.py`):
  normalized pods/workloads/events/logs, a structurally read-only client,
  fixture and real clients, deterministic rules, and evidence-backed diagnoses.
  Verified against fixtures and a live local Kind cluster. Named multi-cluster
  configuration is available through `KUBERNETES_CLUSTERS`, with the legacy
  single-target settings as fallback.
- **GitHub Actions diagnosis** (`app/adapters/github/*`,
  `app/services/github_diagnosis.py`, `app/api/v1/github.py`): structurally
  read-only client, normalized runs/jobs/steps, bounded log excerpts,
  deterministic failure rules, evidence, and diagnosis endpoints. Every request
  is a `GET`; authorization headers are stripped on cross-host log redirects.
- **Terraform plan review** (`app/services/terraform_review.py`,
  `app/api/v1/terraform.py`): parses `terraform show -json`, detects
  replacements/deletions, replacement paths, attribute-name changes, unknown
  values, and stateful-resource risk; reports blast radius and evidence without
  returning attribute values. `POST /api/v1/terraform/explain` adds an optional
  AI explanation backed by the same deterministic evidence.
- **Log analysis** (`app/services/log_analysis.py`,
  `app/api/v1/logs.py`): size-validated paste/upload, signature grouping and
  deduplication, severity/timestamps, stack-frame extraction, redaction,
  evidence, and `POST /api/v1/logs/analyze`. `/logs` is live.
- **Prometheus and correlation** (`app/adapters/prometheus/*`,
  `app/services/metrics.py`, `app/api/v1/metrics.py`): standard-library
  read-only query/query-range adapter, labelled fixture mode, z-score timing
  correlation, evidence, and `/metrics`.
- **Runbooks** (`app/services/runbooks.py`, `app/api/v1/runbooks.py`): static
  read-only catalog, search, finding matching, guardrails, and `/runbooks`.
- **Infrastructure-code generation** (`app/services/infra_code.py`,
  `app/api/v1/infra.py`): deterministic Kubernetes Deployment/Service and
  Terraform module templates, baseline policy findings, and evidence. Output is
  proposal-only; nothing is written or applied. `/infra-code` is live.
- **AI explanation layer** (`app/ai/providers/*`, `app/services/ai.py`,
  `app/api/v1/ai.py`): provider-independent interface, deterministic mock,
  OpenAI-compatible adapter, OpenRouter support, native Anthropic Messages API
  adapter, strict validated JSON, privacy mode, and redaction before
  transmission. AI explanations are optional and deterministic diagnosis remains
  authoritative.
- **Investigations and assistant** (`app/services/investigations.py`,
  `app/api/v1/investigations.py`): authenticated create/read/list/close,
  persisted message history, evidence attachment, AI exchange, tenant scoping,
  and `/assistant`.

### Authorization, tenancy, and security

- Roles: `admin` and `member`; admin-only `/api/v1/admin/users` and
  `/api/v1/admin/tenants`.
- Per-tenant settings and audit scoping; admin retention is itself audited.
- Production always requires authentication even if `AUTH_REQUIRED` is unset.
- Security headers (`nosniff`, frame denial, referrer policy, permissions policy,
  API CSP, production HSTS).
- Session revocation on deactivation; `Secure` cookies off localhost.

### Verification

- Backend: **180 tests passing**; `ruff check` clean.
- Frontend: ESLint and TypeScript clean; production build succeeds with **33
  routes**.
- Dependency-free release route smoke: **16 routes** return a real HTML document
  from the production build (`npm run smoke`).
- Browser-verified earlier: dashboard, sign-in/sign-out, Kubernetes, CI/CD,
  Terraform, logs, assistant, audit, settings, homepage, desktop, and mobile.
  The new runbooks, metrics, and infra-code pages are covered by lint, build, and
  HTTP smoke; an interactive browser pass is still recommended before release.
- Live Kubernetes was verified against a local Kind cluster on the Windows host.
  Live GitHub testing still requires a fresh read-only token in the server
  environment.

## Remaining and blocked

1. **Credential rotation** — the previously exposed GitHub token and OpenRouter
   key must be revoked/rotated before any live verification or deployment.
2. **Live GitHub verification** — needs a fresh fine-grained token with
   `Actions: read`, `Contents: read`, and `Metadata: read`.
3. **Windows checkout sync** — `D:\sre-copilot\openai-agent` is outside this
   environment. Sync the working tree, use Windows kubeconfig paths (not WSL
   `/home/...`), restart both services, and run the release checklist.
4. **Full browser E2E** — no browser test runner is installed and adding one
   requires an explicit dependency decision. The current gate is backend tests +
   frontend lint/build + dependency-free HTTP route smoke. See
   [`docs/TESTING.md`](docs/TESTING.md).
5. **Hardening follow-ups** — shared (Redis-backed) rate limiting, dependency and
   image scanning, CSRF/SSRF review, prompt-injection regression tests,
   encryption-at-rest/key management, and deployment-specific backup/restore.
6. **Do not commit** `frontend/public/SRE_Copilot_Build_Report.pdf`; it is a local
   artifact and remains untracked.

## Operational notes

- Kubernetes, GitHub, Terraform, Prometheus, and infrastructure-code paths are
  read-only. Generated code and remediation are proposals only.
- Multi-cluster selection is supported through `KUBERNETES_CLUSTERS` JSON; the
  legacy single-target settings remain a fallback.
- AI keys stay server-side. Only redacted evidence summaries and the question are
  sent to an external provider; `AI_PRIVACY_MODE=true` or the per-tenant privacy
  override blocks them entirely.
- GitHub needs a fine-grained token with `Actions: read`, `Contents: read`, and
  `Metadata: read` only. Never grant write scopes.
- `AUTH_REQUIRED` is off by default for the local demo, but production always
  enforces authentication. Set it explicitly in any shared environment.
- Do not expose the API publicly until the hardening follow-ups and release
  checklist are complete.
