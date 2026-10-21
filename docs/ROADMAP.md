# Roadmap

Statuses: **Done** · **In progress** · **Planned** · **Blocked**

## Milestone 1 — Audit & stabilize ✅ Done

- Repository audited; feature inventory recorded (see git history / PR notes).
- Fixed: empty Alembic migration (schema was never created) and a latent
  SQLAlchemy mapper bug (`User.audit_events` ↔ `AuditEvent.user`) that meant the
  ORM models could not be configured at all.
- Fixed: app could not boot without Clerk keys; Clerk is now optional.
- Fixed: `NEXT_PUBLIC_API_BASE` vs `NEXT_PUBLIC_API_URL` mismatch.
- Fixed: Docker passed `NEXT_PUBLIC_*` at runtime instead of build time.
- Replaced fabricated status numbers with live integration status.
- Added: expanded validated config, structured logging + request IDs, JSON error
  envelope, secret redaction, request-size/rate-limit middleware, typed schemas
  (evidence/investigation/health/integrations), integration-status API, Evidence
  ORM model + migration, audit service, CI, Docker hardening, and this docs set.
- Tests: 43 backend tests pass; frontend lint + build pass.

## Milestone 2 — Real Kubernetes read-only diagnosis ✅ Done (demo/mock verified)

- Read-only client interface (`KubernetesReadClient`) with **no mutating methods**
  — diagnosis cannot change cluster state.
- Two implementations: `RealKubernetesClient` (official client, lazy import) and
  `FixtureKubernetesClient` (labelled demo snapshot).
- Normalized models: pods, container statuses, events, workloads, namespaces,
  bounded logs.
- Deterministic rules: CrashLoopBackOff, OOMKilled, ImagePullBackOff/ErrImagePull,
  Pending/Unschedulable, probe failures, non-zero exits, log-derived leads.
- Evidence wired to the shared model (provenance, redaction, integrity, `demo`).
- Endpoints: `/api/v1/kubernetes/{clusters,namespaces,workloads,pods,pods/{ns}/{name},
  pods/{ns}/{name}/logs,pods/{ns}/{name}/diagnose}`.
- Frontend `/kubernetes` console: namespace filter, pod list, evidence-backed
  diagnosis view (read-only steps, approval-gated remediation).
- Tests: structural read-only guarantees, fixture client, every rule, redaction,
  and the API surface.

> **Live-cluster verification:** the real client was verified against a local
> Kind cluster (`kind-tws-cluster`) on the user's Windows host, including a
> pending/ImagePullBackOff pod with unavailable logs. This development container
> still has no Docker daemon, so live tests are run on the Docker-enabled host.

## Milestone 2.5 — Self-hosted accounts & dashboard ✅ Done

- Local signup/login: `POST /api/v1/auth/{signup,login,logout}`, `GET /api/v1/auth/me`.
- Passwords hashed with scrypt (stdlib, per-user salt, constant-time compare;
  PBKDF2 fallback). Session tokens are random and stored only as a SHA-256 hash.
- Sessions delivered as a revocable `HttpOnly`, `SameSite=Lax` cookie; the token
  is never returned in a response body.
- Optional API-wide enforcement via `AUTH_REQUIRED` (**off by default**, so the
  demo and tests run without credentials).
- Frontend `/sign-up`, `/login`, and a gated `/dashboard`; the navigation shows
  Sign in / Get started when signed out and the user + log-out when signed in.
- Audit events for signup, login, and logout.
- Tests: signup/login/logout/me, duplicate email, weak password, cookie flags,
  hashing-at-rest, bearer-token auth, and the `AUTH_REQUIRED` gate.

## Milestone 3 — Investigation engine (In progress)

### Milestone 3a — AI explanation layer ✅ Done

- Shared evidence model end-to-end; evidence-backed structured diagnoses.
- Provider-independent interface with a deterministic mock and an
  OpenAI-compatible adapter; OpenRouter is supported via configuration.
- Strict Pydantic validation, timeouts, explicit provider errors, privacy mode,
  and redaction before transmission.
- `POST /api/v1/ai/diagnose` and `/api/v1/ai/summarize`; the Kubernetes console
  has an optional "Explain with AI" panel.
- Provider/model metadata is returned; keys stay server-side.
- Tests: schema, provider selection, JSON validation, privacy mode, unknown
  citation filtering, endpoint errors.

### Remaining

- Investigation persistence + messages API.
- Anthropic's native Messages API adapter.
- Vertical "core investigation flow" slice in demo mode.

## Milestone 4 — GitHub Actions integration ✅ Done (read-only)

- Structurally read-only adapter (`GitHubReadClient`) with only list/get
  operations; every request is a `GET`. No dispatch, re-run, cancel, secret, or
  write path.
- Normalized runs, jobs, steps, and bounded log excerpts.
- Deterministic failure correlation: failed jobs, first failed step, and
  conservative log patterns for dependency, import, test, permission, command,
  image-pull, timeout, OOM, and missing-path failures.
- Evidence-backed diagnosis with missing-log handling; cross-host log-download
  redirects strip the GitHub token.
- Endpoints: `/api/v1/github/{runs,runs/{id},runs/{id}/diagnose}`.
- Frontend `/cicd` console: repository/branch lookup, run and job inspection,
  failure diagnosis, evidence, and optional AI explanation.
- Tests: read-only structure, repo validation, failure rules, log patterns,
  missing logs, successful runs, and redirect token stripping.

## Milestone 5 — Metrics & correlation (Planned)

## Milestone 6 — Terraform review & runbooks (In progress)

### 6a — Terraform plan review ✅ Done

- `POST /api/v1/terraform/review` parses `terraform show -json` plan data.
- Detects replacements and deletions, replacement paths, attribute-name changes,
  unknown values, and stateful-resource risk.
- Reports create/update/replace/destroy/read/no-op counts and a blast-radius
  classification.
- Returns findings and shared evidence; **values are omitted** because plan JSON
  can contain secrets.
- Frontend `/terraform` console: paste or upload a plan, load an illustrative
  sample, and review blast radius, findings, changes, and evidence.
- Tests: action classification, replacement order, stateful risk, unknown values,
  malformed plans, empty plans, and value non-disclosure.

### Remaining

- Runbook library and plan-review-to-runbook links.
- Optional AI explanation for plan findings.

## Milestone 7 — Security & multi-user readiness (Planned)

## Milestone 8 — Deployment & release readiness (Planned)

## Explicitly not implemented

- Authorization, tenant isolation, and API-wide authentication enforcement
  (self-hosted auth exists — see Milestone 2.5 — but `AUTH_REQUIRED` is off by
  default and there is no role/permission model).
- Any infrastructure-mutating action (only recommendations are planned first).
- Anthropic's native provider.
- Log analysis, Prometheus metrics, timelines, runbooks, investigation
  persistence, and multi-cluster selection.
