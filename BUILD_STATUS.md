# Build status

Last updated: **2026-10-22**
Visual baseline: `master` at `85ef4d9` (`Change the UI`).
Active branch: `chore/production-readiness`, currently ahead of `master`. Phase 7
frontend and documentation changes are committed on this branch.

This is the concise source of truth for what is implemented, what is deliberately
bounded, and what remains. The milestone view lives in
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Completed

### Product UI and frontend

- The `85ef4d9` paper/ink visual system is preserved: semantic utilities, 4px
  corners, fonts, motion, responsive layout, and reduced-motion fallbacks.
- `/dashboard` and `/history` are authenticated workspace views. The workspace
  shell includes the collapsible desktop sidebar, mobile drawer, command palette,
  account menu, and sign-out action. `/admin/settings` is the operational admin
  view; `/settings` is customer account settings.
- Live consoles: `/kubernetes`, `/logs`, `/cicd`, `/terraform`, `/assistant`,
  `/metrics`, `/runbooks`, `/audit`, and `/infra-code`. `/dashboard` now reads
  Kubernetes and integration state from `/api/v1/integrations` instead of
  hard-coding a live status.
- `frontend/lib/feature-access.ts` maps every live surface to Free. Pro and Team
  remain explicitly `planned`, unpriced, and not purchasable; billing is disabled.
- Marketing statuses and copy now match the implementation. Logs and Terraform
  are Live, not Planned. Fabricated customer logos, testimonials, operational
  metrics, and the footer uptime claim were removed. Illustrative fixtures and
  demo data remain clearly labelled.
- SEO and access basics: metadata base, Open Graph/Twitter defaults, `/robots.txt`,
  `/sitemap.xml`, per-page titles, noindex auth pages, a branded 404/error view,
  a skip link, main landmarks, and a favicon.
- The unused Clerk dependency and legacy auth shim were removed.

### Backend platform

- FastAPI application with a versioned API (`/api/v1`), health, readiness, and
  liveness endpoints with a real database check.
- Argon2id password hashing with legacy hash upgrade, password policy, login
  lockout, session rotation, idle/absolute expiry, CSRF, revocable API keys, and
  password-confirmed account deletion.
- Personal workspaces on public signup; a configured non-default
  `DEFAULT_TENANT_ID` creates a shared `member` workspace. Roles are
  `owner`, `admin`, `member`, and `viewer`; tenant-scoped resources and the last
  active admin are protected.
- Email verification and password reset, disabled by default and requiring a
  working email delivery path. Production startup rejects SMTP without durable
  jobs.
- Tenant-scoped audit log with filtering, CSV export, configurable retention, and
  request IDs. Structured logs redact known secrets and minimize PII.
- Idempotency keys for unsafe API requests (except auth/webhook routes),
  request-size limits, trusted-proxy rate limits, SSRF/outbound URL policy,
  prompt-injection delimiters, and optional background jobs with encrypted,
  retrying payloads.
- Prometheus metrics, optional OpenTelemetry traces, optional Sentry error
  tracking, graceful shutdown, PostgreSQL pooling/migrations/indexes, and
  documented backup/restore procedures.

### Read-only integrations

- **Kubernetes diagnosis**: normalized pods/workloads/events/logs, structurally
  read-only clients, deterministic rules, evidence-backed diagnoses, named
  multi-cluster selection, and a live console.
- **GitHub Actions diagnosis**: read-only runs/jobs/steps, bounded log excerpts,
  deterministic failure rules, evidence, and cross-host redirect protection.
- **Terraform plan review**: `terraform show -json` parsing, blast radius,
  replacements/deletions, evidence, and optional AI explanation.
- **Log analysis**: size-validated input, grouping/deduplication, stack frames,
  redaction, evidence, and a live console. Raw analyzed log text is not persisted.
- **Prometheus/correlation**, **runbooks**, **infrastructure-code proposals**, and
  **investigations/assistant**: implemented and available in Free.
- **AI explanations**: deterministic mock plus OpenAI-compatible, Groq,
  OpenRouter, and Anthropic adapters. AI is optional and never authoritative.
  Privacy mode blocks external transmission. Prompt evidence is escaped and
  delimited as untrusted data.

### Deployment, quality, and operations

- Non-root backend/frontend images, local Compose, external-PostgreSQL production
  Compose, Helm with a pre-install/pre-upgrade migration Job, optional
  Kubernetes/Terraform wrapper, NetworkPolicies (off by default), and rollback.
- GitHub Actions for CI, approved image release, approved deploy, and rollback.
  Production promotion requires protected environments; repository operators
  must configure required reviewers.
- Backend gates: **267 tests**, **82.9%** line+branch coverage over `backend/app`,
  Ruff, formatting, mypy, Bandit, pip-audit, Alembic checks, and pytest.
- Frontend gates: ESLint, TypeScript, production build (**43 routes**), npm audit,
  clean `npm ci --ignore-scripts`, and a standalone smoke test covering **16 HTML
  routes plus robots, sitemap, icon, and the branded 404**.
- Deployment checks: `helm lint` and `helm template`, kubeconform, both Compose
  configs, Terraform fmt/init/validate, actionlint, hadolint, and pre-commit.

## Remaining and blocked

1. **Credential rotation** — the previously exposed GitHub token and OpenRouter
   key must be revoked and replaced before live integration verification.
2. **Live GitHub verification** — needs a fresh read-only fine-grained token with
   `Actions: read`, `Contents: read`, and `Metadata: read`.
3. **Live deployment verification** — no Docker daemon or Kubernetes cluster is
   available here, so image builds, registry pushes, and a live Helm install
   remain unverified.
4. **Windows checkout sync** — `D:\sre-copilot\openai-agent` is outside this
   environment. Sync the branch, run migrations, restart both services, and run
   the release checklist with Windows kubeconfig paths.
5. **Browser E2E** — the dependency-free HTTP smoke is the current UI gate. A
   browser runner requires an explicit dependency/runner decision.
6. **Hardening follow-ups** — shared/edge rate limiting, KMS/HSM key rotation,
   DNS pinning/egress allow-listing, and a third-party penetration test.
7. **Public marketing review** — customer references, support address, and legal
   terms must be supplied by the operator before public launch. No fake examples
   should be reintroduced.
8. **Do not commit** `frontend/public/SRE_Copilot_Build_Report.pdf` or
   `docs/SRE_Copilot_Build_Report.pdf`; they are local artifacts.

## Operational notes

- Infrastructure paths are read-only; generated infrastructure code is
  proposal-only and is never applied by Tarn.
- `AUTH_REQUIRED` may be off for the local demo, but production always requires
  authentication.
- External AI keys stay server-side. Only redacted evidence summaries and the
  operator's question are sent; `AI_PRIVACY_MODE` blocks transmission.
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` are build-time frontend
  values. Changing them at container runtime does not update the browser bundle.
- Before exposing the API, complete the blocked credential, live-deployment, and
  hardening items above and follow [`docs/RELEASE.md`](docs/RELEASE.md).
