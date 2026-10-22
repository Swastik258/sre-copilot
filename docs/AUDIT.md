# Production-readiness audit

Audit date: **2026-10-22**
Working branch: `chore/production-readiness`
Baseline commit: `85ef4d9` (`Change the UI`)
Scope: backend, frontend, tests, CI, deployment configuration, and documentation.

> This audit is the starting point for the production-readiness phases. Findings
> are fixed in later phases and tracked in [`CHANGELOG.md`](../CHANGELOG.md).
> Nothing in this document should be read as a claim that the application is
> already production-ready.

## Baseline verification

| Gate | Result |
|------|--------|
| Backend lint (`ruff check app tests`) | Pass |
| Backend tests (`pytest`) | **195 passed** |
| Frontend lint (`npm run lint`) | Pass |
| Frontend build (`npm run build`) | Pass, **37 routes** |
| Frontend route smoke (`npm run smoke`) | **16/16 routes returned HTML** |
| Frontend dependency install (`npm ci`) | 0 reported vulnerabilities |
| Working tree before audit | Clean |

Commands used:

```bash
cd backend
.venv/bin/ruff check app tests
.venv/bin/pytest -q --disable-warnings

cd ../frontend
npm ci
npm run lint
npm run build
npm run start &
RELEASE_BASE_URL=http://localhost:3000 npm run smoke
```

The backend had no lockfile at baseline; `pyproject.toml` was the canonical
dependency manifest and the frontend used `package-lock.json`.

## Current architecture

```
Browser
  └─ Next.js 16 App Router (TypeScript)
       ├─ static marketing/auth route groups
       ├─ authenticated product console (cookie-based session)
       └─ lib/api.ts typed fetch client
              │ HTTPS/JSON, credentials: include
              ▼
       FastAPI /api/v1
       ├─ middleware: request ID, security headers, CORS, rate limit, body cap
       ├─ auth dependencies (optional session, required user, admin)
       ├─ routers → services → SQLAlchemy
       │    ├─ read-only Kubernetes / GitHub / Prometheus adapters
       │    ├─ deterministic log, Terraform, runbook, infra-code services
       │    ├─ optional AI explanation providers
       │    └─ investigations, audit, settings, account services
       └─ SQLite for local demo or PostgreSQL through Alembic
```

### Backend surfaces

- **Auth**: self-hosted email/password, scrypt hashes, opaque server-side
  sessions, `HttpOnly` cookie, bearer API keys.
- **Tenancy**: `tenant_id` string on users, investigations, audit events, and
  settings. Roles are `admin` and `member`.
- **Integrations**: Kubernetes (single or named multi-cluster), GitHub Actions,
  Prometheus, and an optional AI provider. All infrastructure adapters are
  read-only by construction.
- **Product services**: evidence model, Kubernetes/GitHub diagnosis, log
  analysis, Terraform review, metrics correlation, runbooks, proposal-only
  infrastructure code, investigations, assistant exchange, audit, settings.
- **Migrations**: Alembic revisions `0001` through `0006`, plus additive local
  SQLite upgrades.

### Frontend surfaces

- Marketing pages, auth pages, and a product workspace with 37 built routes.
- Existing product pages call live endpoints for Kubernetes, CI/CD, Terraform,
  logs, assistant, metrics, runbooks, audit, settings, and infra-code.
- Plan access is currently a frontend-only Free/Pro/Team map; Free unlocks all
  features.

## Findings (ranked)

Severity reflects the risk if the application is exposed to untrusted users.
Items marked **blocker** must be fixed before a public SaaS deployment.

### Critical / blocker

| # | Area | Finding | Impact |
|---|------|---------|--------|
| C1 | Authentication | No email verification, password-reset flow, account lockout, or login-specific brute-force throttle. | Account takeover attempts and typo/abandoned addresses are unmanaged; password recovery requires operator intervention. |
| C2 | Session security | Sessions are fixed 7-day bearer cookies with no refresh rotation, idle timeout, or explicit CSRF token. `SameSite=Lax` reduces but does not fully document/verify cross-site request risk. | A stolen token remains valid for its full lifetime; state-changing cookie requests lack a second control. |
| C3 | Authorization | Only `admin`/`member`; no Owner/Viewer semantics. Many read routes are bypassable locally unless `AUTH_REQUIRED` is set. Integration data is deployment-global rather than organization-scoped. | Viewer cannot be made read-only; multi-tenant deployments cannot safely share one API process. |
| C4 | Tenant model | Tenancy is a free-form `tenant_id` string with no Organization entity, membership table, invitations, ownership, or plan association. | No auditable workspace membership lifecycle; role changes are ad hoc and plan data cannot be attached reliably. |
| C5 | Plans/billing | Plan/entitlements exist only in the frontend. No backend usage limits, Stripe-compatible customer/subscription model, webhook stub, or metering. | Backend cannot enforce a plan; billing would require a schema migration and route rewrite. |
| C6 | Deployment | Docker images run as root (frontend) or single-stage builds; no Kubernetes/Helm manifests, staging/production workflow, manual approval, image scanning, or rollback automation. | Not safely deployable as a multi-instance production service. |
| C7 | Observability | Health and JSON logs exist, but there is no runtime Prometheus endpoint, OpenTelemetry tracing, error-tracking hook, or documented backup/restore procedure. | Failures cannot be diagnosed or recovered to a production standard. |
| C8 | Credentials | No startup fail-fast validation for production secrets/configuration. Previously exposed GitHub/OpenRouter credentials remain a release blocker. | A misconfigured production boot may silently run with unsafe defaults. |
| C9 | Repository hygiene | 450 tracked `.venv-wsl` files, a tracked build-report PDF, and no backend lockfile. | Bloated clone, non-reproducible installs, and accidental artifact publication. |

### High

| # | Area | Finding | Impact |
|---|------|---------|--------|
| H1 | CSRF/SSRF | No explicit CSRF token validation and no URL policy for server-side integration endpoints. Integration URLs are operator-controlled, but production validation is absent. | Cookie-authenticated writes rely on browser defaults; a misconfigured URL could reach unintended internal services. |
| H2 | Rate limiting | In-memory, per-process, IP-only limiter; no proxy-aware client key, standard rate-limit headers, auth-specific limits, or shared store. | Multi-instance limits are ineffective; login and expensive AI routes share the global budget. |
| H3 | Password hashing | scrypt is sound, but the requested argon2/bcrypt option, stronger policy, and rehash-on-login migration are absent. | Weaker operational story and no path to upgrade hashes. |
| H4 | Input/body limits | Body cap trusts `Content-Length`; chunked or lying requests can bypass it. No generic idempotency support. | Memory/CPU abuse and duplicate mutations on retries. |
| H5 | Error/audit coverage | Audit events cover many sensitive actions, but failed logins, password resets, key creation/revocation, exports, and account deletion are not consistently recorded. | Incident reconstruction has gaps. |
| H6 | Data export/retention | Account deletion is hard-delete; no self-service data export; no scheduled retention worker. | Privacy requests require manual database work; audit retention is manual. |
| H7 | Background work | AI, integration reads, and retention run synchronously in request handlers. No job retries, timeout framework, or graceful shutdown of background work. | Slow upstreams consume workers; long jobs are lost on deploy. |
| H8 | Tests | No coverage measurement/gate, no browser E2E runner, no dependency/image scanning, no pre-commit hooks. | Regressions in untested paths and vulnerable dependencies can merge. |
| H9 | Frontend honesty | Homepage still labels logs/Terraform as Planned; pricing presents paid tiers and trials that do not exist; security page says roles/tenancy are missing; dashboard hardcodes “Kubernetes Live”; marketing footer says “All systems operational”. | Contradicts shipped status and the project's no-fabrication principle. |
| H10 | Marketing placeholders | Homepage includes fictional client names and testimonials (labelled as fictional) and unsupported integration logos. | Conflicts with the instruction not to invent customers or imply integrations that do not exist. |

### Medium

| # | Area | Finding | Impact |
|---|------|---------|--------|
| M1 | Database | No pool sizing/timeouts, no connection retry policy, no soft-delete/retention strategy for investigations/evidence, no migration backup guard. | Poor behavior under load and risky upgrades. |
| M2 | Config | Integration URLs and kubeconfig paths lack comprehensive validation; production can boot with SQLite or disabled auth. | Misconfiguration may surface at request time instead of startup. |
| M3 | API | Some list endpoints are unpaginated (Kubernetes/GitHub upstream lists, audit export bounded only by hard limit); OpenAPI is at `/openapi.json` rather than the requested `/api/docs`. | Large responses and inconsistent documentation URL. |
| M4 | Frontend auth | No refresh-on-expiry, no route-level plan data from backend, no centralized handling for 401 after session expiry. | Users see avoidable errors and stale plan labels. |
| M5 | SEO/accessibility | No sitemap/robots/manifest; metadata is inconsistent; no documented Lighthouse/axe pass. | Weaker discoverability and incomplete production polish. |
| M6 | Legal | Privacy/Terms exist, but no cookie-policy hooks or operator-customizable legal configuration. | Deployers must rewrite pages before launch. |
| M7 | Dependency policy | `@clerk/nextjs` remains installed but unused. No dependency update automation. | Unused attack surface and drift. |
| M8 | Testing data | Session-scoped SQLite test database means tests share state; unique emails are required and admin state can leak between tests. | Subtle ordering/flakiness risk. |
| M9 | Health | Readiness checks only the database; it does not report migration status, queue/worker state, or integration configuration validity. | Kubernetes may route traffic to a partially ready process. |
| M10 | Docs | Build status/roadmap contain stale counts and baseline; missing DEPLOYMENT, CONFIGURATION, RUNBOOK, and CHANGELOG documents. | Operators cannot follow a single current source of truth. |

### Low

| # | Area | Finding | Impact |
|---|------|---------|--------|
| L1 | Frontend dependencies | `@clerk/nextjs` unused; `framer-motion` is used; no bundle-size budget. | Unnecessary bytes and audit noise. |
| L2 | API ergonomics | No `/api/v1/plans`, `/api/v1/usage`, or `/api/v1/me/entitlements`; account response exposes a bare `plan` string. | Frontend cannot render backend-authoritative entitlements. |
| L3 | Audit UI | Export uses a direct browser link rather than the typed client; error handling for failed downloads is limited. | Minor UX inconsistency. |
| L4 | Local schema | Additive SQLite upgrade code duplicates migration intent and can drift from Alembic. | Maintenance risk. |
| L5 | Tests/docs | No test for prompt-injection inputs, SSRF URL policy, or redaction of new fields. | Gaps in security regression coverage. |

## Deliberately bounded behavior (not bugs)

- Kubernetes, GitHub, Prometheus, Terraform, and infra-code paths are read-only
  or proposal-only. No apply/dispatch/remediation execution is intended.
- Generated infrastructure code is a proposal for human review.
- Demo mode serves labelled fixtures. It must never be presented as live data.
- Secrets are operator-managed environment values, not editable through the UI.
- Public signup does not grant administrator access.

## Phase mapping

| Phase | Primary findings addressed |
|-------|----------------------------|
| 0 | This audit, repository hygiene baseline, lockfile, current docs |
| 1 | C1–C4, H3, H5; auth, verification/reset, lockout, roles, organizations, CSRF, session rotation |
| 2 | C5, L2; backend plans, entitlements, usage, billing-ready schema/webhook stubs |
| 3 | C8, H1, H2, H4, H7, M1, M2, M3; validation, limits, SSRF policy, encryption hook, jobs, pooling |
| 4 | C7, M9; metrics, tracing, error hook, backup/restore |
| 5 | H8, M8, L5; coverage, pre-commit, dependency scanning, security regression tests |
| 6 | C6, C9; multi-stage non-root images, CI security/deploy, Helm/manifests, configs, rollback |
| 7 | H9, H10, H6, M4–M6; honest data wiring, export, SEO, legal hooks, accessibility |
| 8 | M10; complete documentation/OpenAPI/CHANGELOG |

## Baseline limitations to preserve in status docs

- Browser E2E is not automated; no browser runner dependency was approved.
- Live GitHub, rotated AI keys, live Prometheus, multi-cluster, and the Windows
  checkout remain environment-dependent verification items.
- The exposed GitHub token and OpenRouter key must be revoked before any live
  check.
- The application remains read-only by design; production readiness must not
  introduce infrastructure mutation paths.
