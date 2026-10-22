# Roadmap

Last updated: **2026-10-22**
Visual baseline: `master` at `85ef4d9` (`Change the UI`).
Active branch: `chore/production-readiness`.

Statuses: **Done** · **Partial** · **Blocked** · **Future**

## At a glance

| Area | Status | What exists | Remaining |
|------|--------|-------------|-----------|
| Kubernetes diagnosis | **Done** | Read-only client, fixtures, deterministic rules, evidence, `/kubernetes`, named multi-cluster selection | Live re-verification after Windows sync |
| GitHub Actions | **Done** | Read-only runs/jobs/logs, deterministic rules, `/cicd` | Live verification needs a fresh read-only token |
| Terraform plan review | **Done** | Plan JSON parsing, blast radius, evidence, `/terraform`, optional AI explanation | None known |
| AI explanations | **Done** | Mock, OpenAI, Groq, OpenRouter, native Anthropic; privacy mode; redaction | Live provider check after key rotation |
| Accounts and dashboard | **Done** | Argon2id auth, workspaces, gated dashboard, live integration status | None known |
| Authorization and tenancy | **Done** | Owner/admin/member/viewer roles, tenant-scoped resources, email verification and recovery, session revocation | Granular per-resource policy is intentionally simple |
| Product UI | **Done** | Paper/ink themes, semantic utilities, motion, responsive shell, live statuses | Full browser E2E runner |
| Logs | **Done** | Analyzer, endpoint, evidence, live console | None known |
| Assistant and investigations | **Done** | Persisted cases, message history, evidence, AI exchange, live `/assistant` | Richer read-only tool orchestration |
| Audit | **Done** | Read/filter/export API, admin retention, live console, request IDs | Shared retention scheduling |
| Settings | **Done** | Per-workspace privacy/retention policy, admin user controls, account deletion | Secret editing is intentionally unsupported |
| Prometheus | **Done** | Read-only adapter, fixture mode, query endpoint, correlation, live console | Shared query cache is future work |
| Multi-cluster | **Done** | `KUBERNETES_CLUSTERS` JSON, legacy fallback, selector in API/UI | Live multi-cluster verification |
| Runbooks and infra-code | **Done** | Runbook catalog/matching/UI; deterministic Deployment/Service/Terraform proposals | Diff/apply workflow is explicitly out of scope |
| Deployment and release | **Partial** | Non-root images, Compose, Helm, Terraform wrapper, approved workflows, rollback, docs | Live registry/Helm verification; Browser E2E; credential checks; Windows sync |
| Frontend production polish | **Done** | Accurate live statuses, SEO, sitemap/robots, 404/error states, skip link, legal/security copy | Operator-supplied support/legal review |

## Milestone 1 — Audit and stabilize ✅ Done

- Repository audited; feature inventory recorded.
- Fixed the empty Alembic migration and a latent SQLAlchemy mapper bug.
- Removed Clerk from the runtime path and deleted the unused dependency.
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

## Milestone 2.5 — Self-hosted accounts and workspaces ✅ Done

- Signup/login/logout/me, Argon2id password hashing, server-side sessions.
- `HttpOnly`, `SameSite=Lax`, revocable cookies; CSRF and idle/absolute expiry.
- Personal workspace on public signup; configured shared workspace and roles.
- Email verification, password reset, login lockout, API keys, and account deletion.
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
- Live `/assistant` console with citations and proposal-only outputs.

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
- Stack-frame extraction and redaction before response/model use.
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
- Owner/admin/member/viewer roles, admin user/tenant APIs, last-admin lockout
  protection, and session revocation on deactivation.
- Tenant-scoped investigations, settings, and audit views. Membership changes
  do not move records between workspaces; join/leave/switch is handled by the
  organizations API.
- Production authentication enforcement, security headers, CSRF, trusted-proxy
  rate limiting, and conservative production defaults.

## Milestone 8 — Deployment and release readiness 🟡 Partial

- CI runs backend lint/tests/coverage/security gates and frontend
  lint/typecheck/build/audit.
- Dependency-free production smoke (`npm run smoke`) checks 16 HTML routes plus
  robots, sitemap, icon, and the branded 404.
- Non-root backend/frontend images, local Compose, external-PostgreSQL production
  Compose, Helm with migration Job, optional Terraform wrapper, and rollback.
- Protected release/deploy workflows; approval requires repository operators to
  configure required reviewers.
- Deployment, operations, rollback, and release checklists documented.

Remaining before a public release:

- Approve and install a browser E2E runner (or perform a documented manual
  browser pass). The project intentionally adds no unapproved frontend
  dependencies.
- Rotate exposed credentials and complete live GitHub, AI-provider, Prometheus,
  and multi-cluster checks.
- Build/push images and run a live Helm or production-Compose deployment in an
  approved environment.
- Sync to the Windows checkout with Windows-accessible kubeconfig paths.
- Complete the hardening items in [docs/SECURITY.md](SECURITY.md).

## Hardening and future work

- Shared (Redis-backed or edge) rate limiting for multi-instance deployments.
- KMS/HSM-backed key management and rotation.
- DNS pinning and network egress allow-listing.
- Richer assistant tool orchestration while preserving read-only contracts.
- Diff preview and export for infrastructure code; no apply path.
- Scheduled audit retention.

## Explicit non-goals

- Mutating Kubernetes, GitHub, Terraform, or infrastructure state from diagnosis.
- Running shell commands or applying generated code.
- Storing provider keys or integration tokens in the browser or API.
- Fabricating logs, metrics, events, diagnoses, customers, or integration status.
