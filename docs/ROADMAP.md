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

> **Live-cluster verification pending:** this development container has no Docker
> daemon, so kind / Minikube / live-cluster runs must happen on a Docker-enabled
> host. The real client is import-verified but not exercised against a live API
> here.

## Milestone 3 — Investigation engine (Planned)

- Shared evidence model end-to-end; evidence-backed structured diagnoses.
- Investigation persistence + messages API.
- Mock provider implemented; OpenAI-compatible and Anthropic providers behind one
  interface, with schema validation, timeouts, and a privacy mode.
- Vertical "core investigation flow" slice in demo mode.

## Milestone 4 — GitHub Actions integration (Planned)

## Milestone 5 — Metrics & correlation (Planned)

## Milestone 6 — Terraform review & runbooks (Planned)

## Milestone 7 — Security & multi-user readiness (Planned)

## Milestone 8 — Deployment & release readiness (Planned)

## Explicitly not implemented

- Backend authentication/authorization, tenant isolation.
- Any infrastructure-mutating action (only recommendations are planned first).
- AI providers beyond a configuration placeholder.
- Log analysis, metrics, timelines, runbooks, Terraform review.
