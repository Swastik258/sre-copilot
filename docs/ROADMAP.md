# Roadmap

Last updated: **2026-10-21**
Current baseline: `master` at `e9b0966`; the work below is uncommitted.

Statuses: **Done** · **Partial** · **Blocked** · **Future**

## At a glance

| Area | Status | What exists | Remaining |
|------|--------|-------------|-----------|
| Kubernetes diagnosis | **Done** | Read-only client, fixtures, deterministic rules, evidence, `/kubernetes`, named multi-cluster selection | Live re-verification after Windows sync |
| GitHub Actions | **Done** | Read-only runs/jobs/logs, deterministic rules, `/cicd` | Live verification needs a fresh read-only token |
| Terraform plan review | **Done** | Plan JSON parsing, blast radius, evidence, `/terraform`, AI explanation | None known |
| AI explanations | **Done** | Mock, OpenAI, Groq, OpenRouter, native Anthropic; privacy mode; redaction | Live provider check after key rotation |
| Accounts and dashboard | **Done** | Self-hosted auth, gated dashboard, auth-aware nav | None known |
| Authorization and tenancy | **Done** | Admin/member roles, tenant-scoped investigations/settings/audit, admin APIs, session revocation | Shared-role granularity is intentionally simple |
| Product UI | **Done** | Paper/ink themes, semantic utilities, motion, responsive shell | Full browser E2E runner |
| Logs | **Done** | Analyzer, endpoint, evidence, live console | None known |
| Assistant and investigations | **Done** | Persisted cases, message history, evidence, AI exchange, live `/assistant` | Richer read-only tool orchestration |
| Audit | **Done** | Read/filter/export API, admin retention, live console | Shared retention scheduling |
| Settings | **Done** | Per-tenant privacy/retention policy, admin user/tenant controls | Secret editing remains intentionally unsupported |
| Prometheus | **Done** | Read-only adapter, fixture mode, query endpoint, correlation, live console | Shared query cache is future work |
| Multi-cluster | **Done** | `KUBERNETES_CLUSTERS` JSON, legacy fallback, selector in API/UI | Live multi-cluster verification |
| Runbooks and infra-code | **Done** | Runbook catalog/matching/UI; deterministic Deployment/Service/Terraform proposals | Diff/apply workflow is explicitly out of scope |
| Release readiness | **Partial** | CI lint/test/build, HTTP route smoke, release checklist | Browser E2E runner; live credential checks; Windows sync |

## Milestone 1 — Audit and stabilize ✅ Done

- Repository audited; feature inventory recorded.
- Fixed the empty Alembic migration and a latent SQLAlchemy mapper bug.
- Removed Clerk from the runtime path while leaving the package installed.
- Fixed API-base environment mismatch and Docker build-time `NEXT_PUBLIC_*`.
- Replaced fabricated status numbers with live integration status.
- Added validated config, structured logging, request IDs, JSON errors, redaction,
  request-size/rate-limit middleware, typed schemas, Evidence model/migration,
  audit service, CI, Docker hardening, and the docs set.

## Milestone 2 — Read-only Kubernetes diagnosis ✅ Done

- Structurally read-only client with fixture and real implementations.
- Normalized pods, workloads, events, namespaces, and bounded logs.
- Deterministic rules for CrashLoopBackOff, OOMKilled, image pulls, scheduling,
  probes, exits, and log-derived leads.
- Evidence with provenance, redaction, integrity, and `demo`.
- Live verification against a local Kind cluster on the Windows host.

## Milestone 2.5 — Self-hosted accounts and dashboard ✅ Done

- Signup/login/logout/me, scrypt password hashing, server-side sessions.
- `HttpOnly`, `SameSite=Lax`, revocable cookies.
- Optional `AUTH_REQUIRED` for local deployments; production always enforces.
- Gated `/dashboard`, auth-aware navigation, and auth audit events.

## Milestone 3 — Investigation engine ✅ Done

### 3a — AI explanation layer

- Provider-independent interface with mock, OpenAI-compatible providers
  including Groq, OpenRouter, and native Anthropic adapters.
- Strict Pydantic validation, timeouts, explicit errors, privacy mode, and
  redaction before transmission.
- Optional AI panels in Kubernetes, GitHub, Terraform, and investigations.

### 3b — Assistant and investigation persistence

- Create/read/list/close investigations with tenant scoping.
- Persisted messages, evidence attachment, and AI exchanges.
- Live `/assistant` console with citations and approval-gated proposals.

### 3c — Anthropic native provider

- Native Messages API payload/response handling and factory wiring.
- Anthropic configuration works with `AI_PROVIDER=anthropic`.

## Milestone 4 — GitHub Actions integration ✅ Done (read-only)

- Structurally read-only adapter; every request is `GET`.
- Normalized runs/jobs/steps and bounded log excerpts.
- Deterministic failure correlation and evidence-backed diagnosis.
- Cross-host log redirects strip the GitHub token.
- Live `/cicd` console.

## Milestone 5 — Logs, metrics, and correlation ✅ Done

### 5a — Log analysis

- Size/type-validated paste/upload, never forwarded raw to a third party.
- Signature grouping/deduplication, counts, timestamps, severity, and samples.
- Stack-frame extraction and redaction before storage/model use.
- `POST /api/v1/logs/analyze` and live `/logs`.

### 5b — Prometheus metrics

- Standard-library read-only adapter for query and query-range.
- Configurable windows, limits, query validation, and explicit upstream errors.
- Fixture mode when enabled without a URL and `PROMETHEUS_DEMO_MODE=true`.
- Live `/metrics` console that shows the actual query/range and data.

### 5c — Correlation and multi-cluster

- Z-score timing correlation with explicit labels/timestamps and evidence.
- Correlation is reported as a hypothesis, not proven causality.
- `KUBERNETES_CLUSTERS` JSON defines named read-only targets; legacy single-target
  settings remain a fallback. The API and UI accept a cluster selector.

## Milestone 6 — Terraform, runbooks, and infra-code ✅ Done

- Terraform plan review detects replacements, deletions, replacement paths,
  attribute-name changes, unknown values, and stateful risk.
- `POST /api/v1/terraform/explain` adds an optional AI explanation using the same
  redacted evidence.
- Static runbook catalog with search, finding matching, steps, and guardrails.
- Deterministic Kubernetes Deployment/Service and Terraform module generation
  with policy findings and evidence.
- `/runbooks` and `/infra-code` are live; generated code is proposal-only.

## Milestone 7 — Audit, settings, and multi-user readiness ✅ Done

- Audit browser with filters, pagination, CSV export, and admin-only retention.
- Per-tenant settings for AI privacy, retention, and default environment.
- Admin/member roles, admin user/tenant APIs, last-admin lockout protection, and
  session revocation on deactivation.
- Tenant-scoped investigations, settings, and audit views; moving a member
  migrates their investigations.
- Production authentication enforcement, security headers, and conservative
  production rate limiting.

## Milestone 8 — Deployment and release readiness 🟡 Partial

- CI runs backend lint/tests and frontend lint/build.
- Dependency-free production route smoke (`npm run smoke`) checks 16 routes.
- Release and Windows sync checklist documented in
  [docs/RELEASE.md](RELEASE.md).
- Docker Compose remains the local deployment path.

Remaining before a public release:

- Approve and install a browser E2E runner (or perform a documented manual
  browser pass). The project intentionally adds no unapproved frontend
  dependencies.
- Rotate exposed credentials and complete live GitHub, OpenRouter/Anthropic,
  Prometheus, and multi-cluster checks.
- Sync to the Windows checkout with Windows-accessible kubeconfig paths.
- Complete the hardening items in [docs/SECURITY.md](SECURITY.md).

## Hardening and future work

- Shared (Redis-backed) rate limiting for multi-instance deployments.
- Dependency and container-image scanning in CI.
- CSRF/SSRF review and prompt-injection regression tests.
- Encryption-at-rest/key-management and backup/restore strategy.
- Richer assistant tool orchestration while preserving read-only contracts.
- Diff/apply workflow for infra-code, still behind explicit human approval.
- Scheduled audit retention.

## Explicit non-goals

- Mutating Kubernetes, GitHub, Terraform, or infrastructure state from diagnosis.
- Running shell commands or applying generated code.
- Storing provider keys or integration tokens in the browser or API.
- Fabricating logs, metrics, events, diagnoses, or integration status.
