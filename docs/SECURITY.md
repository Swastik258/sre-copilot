# Security

> **Honest status.** Authentication, organizations, role-based authorization,
> tenant-scoped audit records, CSRF, streaming request caps, proxy-aware rate
> limits, API idempotency, outbound URL policy, prompt-injection boundaries,
> encrypted durable job payloads, retrying background jobs, PII-minimised
> structured logs, Prometheus metrics, readiness checks, and optional
> OpenTelemetry/Sentry export are implemented and covered by backend tests. Shared multi-instance rate limiting, dependency
> and image scanning, DNS pinning/egress controls, external key management, and
> browser E2E remain open. Do not expose the API to untrusted networks until the
> release checklist and the "Remaining controls" below are complete.

## Threat model (summary)

Assets: infrastructure credentials, cluster read access, source-repository
access, collected operational data (logs, events, manifests), and audit records.

Primary threats:

1. **Credential theft** — API tokens, kubeconfigs, or connection strings leaking
   via logs, evidence payloads, API responses, or the frontend bundle.
2. **Excessive access** — integrations granted more than read-only permissions.
3. **Prompt injection** — instructions hidden in logs, manifests, repo files, or
   issues attempting to steer the AI.
4. **Data exfiltration** — sending sensitive operational data to external LLM
   providers.
5. **Mutating actions** — any code path that changes infrastructure without
   explicit human approval.
6. **Tenant crossover** — one organization reading another's data.
7. **Account lockout** — losing the only administrator or leaving stale sessions.

Design responses: read-only-by-default, redaction, privacy mode, evidence
provenance, approval workflow, audit logging, tenant scoping, and admin lockout
protection.

## Implemented controls

| Control | Where | Notes |
|---------|-------|-------|
| Secret redaction | `app/core/redaction.py` | Best-effort denylist + `key=value`; applied to logs, evidence, audit. |
| Log redaction filter | `app/core/logging.py` | Redacts formatted records before emission. |
| Correlation IDs | `app/core/request_context.py` | `X-Request-ID` on every request/response. |
| Consistent error envelope | `app/core/errors.py` | Internal errors never leak stack traces to clients. |
| Request size limit | `app/core/ratelimit.py` | Streaming `MAX_REQUEST_BYTES` cap (default 2 MB); rejects lying or chunked oversized bodies. |
| Rate limiting | `app/core/ratelimit.py` | In-memory sliding window, separate auth-write budget, standard `RateLimit-*` headers, optional trusted-proxy handling. Production defaults to 120/min and 10 auth writes/min. |
| API idempotency | `app/core/idempotency.py` | Opt-in `Idempotency-Key` reserves, caches, and replays successful JSON mutations; conflicting reuse is `409`; auth/webhook routes are excluded. |
| Outbound URL policy | `app/core/urls.py` | Rejects non-HTTP(S), embedded credentials, queries/fragments, and cloud-metadata endpoints; production requires HTTPS for configured external base URLs. |
| Durable jobs | `app/services/jobs.py`, `app/services/job_handlers.py` | Database-backed retries with bounded attempts/backoff, encrypted payloads, maintenance scheduling, and graceful worker shutdown. |
| Payload encryption | `app/security/encryption.py` | Fernet envelope encryption for queued email tokens; no plaintext secret in job rows; tamper detection. |
| Security headers | `app/core/security.py` | `nosniff`, frame denial, referrer policy, permissions policy, API CSP, production HSTS. |
| CORS allowlist | `app/main.py` | Explicit origins; methods/headers enumerated. |
| Integration status without secrets | `app/services/integrations.py` | Reports configuration state only; never returns tokens. |
| Demo labelling | `schemas/evidence.py`, frontend | Fixture data flagged `demo=true`. |
| Audit events | `app/services/audit.py` | Redacted resource/outcome payloads; tenant-scoped; retention is audited. |
| Account passwords | `app/security/passwords.py`, `app/security/password_policy.py` | Argon2id with per-user salt; legacy scrypt/PBKDF2 verified and upgraded on login; 12-character minimum, denylist, and email-name rejection. |
| Local signup/login | `app/services/auth.py`, `app/api/v1/auth.py` | Self-hosted accounts; the session token is never returned in a body; failed logins are counted and temporarily locked. |
| Signup privilege boundary | `app/services/auth.py`, `app/api/v1/organizations.py` | Public signup owns a personal workspace; shared-workspace mode creates members. Roles are never derived from email or signup order. |
| Session tokens | `app/security/tokens.py` | 256-bit `secrets.token_urlsafe`; only the SHA-256 hash is stored. |
| Customer API keys | `app/api/v1/account.py`, `app/db/models.py` | Random bearer secrets; only hashes are stored, keys are owner-scoped, revocable, and shown once. |
| Customer settings | `app/api/v1/account.py` | Profile, preferences, integrations, and keys are scoped to the authenticated user. |
| Session cookie | `app/api/v1/auth.py` | `HttpOnly`, `SameSite=Lax`, `Secure` off localhost, absolute and idle TTLs, revocable, rotated through `/auth/refresh`. |
| Production authentication | `app/api/deps.py` | Production always requires authentication even if `AUTH_REQUIRED` is unset. |
| Roles and admin APIs | `app/services/admin.py`, `app/services/organizations.py` | `owner`/`admin`/`member`/`viewer`; owner/admin manage users; members mutate investigations; viewers are read-only; last owner protected. |
| Session revocation | `app/services/admin.py`, `app/services/auth.py` | Deactivation, password change, and password reset revoke active sessions. |
| Tenant scoping | investigations, audit, settings | Tenant predicates are applied to every query; members/viewers see their own investigations; owners/admins see their workspace only; cross-tenant administration is rejected. |
| Per-tenant settings | `app/services/settings_store.py` | Privacy/retention/environment policy is scoped by tenant. |
| Email verification | `app/services/email.py`, auth routes | Single-use, hashed, expiring tokens; optional enforcement; production rejects console delivery. |
| Password recovery | `app/services/email.py`, auth routes | Generic forgot-password response prevents enumeration; reset tokens are single-use and revoke all sessions. |
| OAuth | `app/services/oauth.py` | Optional Google/GitHub authorization-code flow with state cookie, fixed HTTPS endpoints, verified-email linking, and no provider token persistence. |
| CSRF | `app/core/csrf.py` | Double-submit cookie plus Origin/Referer allow-list for unsafe cookie-authenticated requests; production always enabled. |
| Production fail-fast | `app/core/config.py`, `app/main.py` | Unsafe production combinations abort startup instead of silently degrading. |
| GitHub read-only adapter | `app/adapters/github/client.py` | Only `GET`; no dispatch/re-run/cancel path; token stripped on cross-host log redirects. |
| Terraform value omission | `app/services/terraform_review.py` | Attribute names and change metadata only, never plan values. |
| AI evidence minimisation | `app/services/ai.py` | Sends redacted evidence summaries and the question only; privacy mode blocks external providers. |
| Prompt-injection boundary | `app/services/ai.py`, `tests/unit/test_prompt_boundaries.py` | Evidence is delimited as untrusted data and the system prompt forbids following embedded instructions or requesting writes. |
| Database hardening | `app/db/session.py` | PostgreSQL pool sizing/overflow/timeout/recycle and pre-ping; SQLite foreign keys and busy timeout enabled. |
| Structured access logs | `app/core/observability.py`, `app/core/logging.py` | Route templates, status, duration, request/trace ids; no query strings, bodies, cookies, addresses, or users. |
| Metrics | `app/core/prom_metrics.py`, `/metrics` | Prometheus text format with bounded labels; optional bearer token and production fail-fast. |
| Health/readiness | `app/api/v1/health.py` | Liveness is dependency-free; readiness checks DB and production migration revision and returns 503. |
| Optional tracing/error tracking | `app/core/telemetry.py` | OTel API spans and Sentry export are opt-in; PII disabled and event data scrubbed. |
| Backup/restore | `deploy/backup.sh`, `deploy/restore.sh` | Verified local backups with checksums; restore requires explicit confirmation and a production guard. |
| Proposal-only infra code | `app/services/infra_code.py` | Deterministic files and policy findings; no write/apply path. |

## Production deployment policy

- Set `ENVIRONMENT=production`, `AUTH_REQUIRED=true`, and `AI_PRIVACY_MODE` to
  the value required by your data policy. Production fails fast if
  `AUTH_REQUIRED` is false, SQLite is selected, CORS is wildcard, `APP_BASE_URL`
  is not HTTPS, debug/console delivery is enabled, or OAuth redirects are
  insecure.
- Terminate TLS in front of the API and frontend. Cookies become `Secure` outside
  local environments; HSTS is emitted in production.
- Keep `CORS_ORIGINS` to the exact frontend origin and never combine it with `*`.
- Use Postgres and Alembic migrations (`AUTO_CREATE_SCHEMA` is for local SQLite).
- Set an explicit `RATE_LIMIT_PER_MINUTE` if 120/min is not appropriate. If an
  ingress proxy is used, list only its address(es) in `TRUSTED_PROXY_IPS`; never
  trust `X-Forwarded-For` from an arbitrary client.
- Enable `BACKGROUND_JOBS_ENABLED=true` and set a valid
  `CREDENTIAL_ENCRYPTION_KEY` whenever email delivery is enabled. The key must
  come from a secret manager; queued payloads are unreadable without it.
- Size the PostgreSQL pool for the process count (`DATABASE_POOL_SIZE`,
  `DATABASE_MAX_OVERFLOW`, timeouts/recycle). Use an external connection pooler
  when running many replicas.
- Clients that retry mutations should send a unique `Idempotency-Key`; replayed
  responses carry `Idempotency-Replayed: true`.
- Each public signup owns a personal workspace as `owner`. Add teammates through
  `POST /api/v1/organizations/{id}/members`; workspace owners/admins manage roles
  there. The legacy `scripts/set_admin.py` remains available for trusted local
  recovery.
- Ensure at least two owners or admins in a shared workspace before operational
  handoff. The last owner cannot be demoted or removed.
- Configure `EMAIL_DELIVERY=smtp` for production. Console delivery is rejected;
  enable `EMAIL_VERIFICATION_REQUIRED=true` once mail delivery is verified.
- CSRF protection is always on in production. Same-origin clients must mirror the
  readable `sre_csrf` cookie into `X-CSRF-Token` on unsafe requests.
- Register OAuth callback URLs under `OAUTH_REDIRECT_BASE_URL` if Google or
  GitHub login is enabled; leave both client values unset to disable a provider.

## Remaining controls

- **Shared rate limiting** — the limiter is still per-process/in-memory. Use an
  edge limiter or Redis for a multi-instance deployment; do not treat this as a
  distributed quota.
- **Dependency and image scanning** — scheduled for the CI phase; not yet wired
  into an enforced workflow.
- **SSRF completion** — configuration URLs are validated and metadata endpoints
  are rejected, but there is no DNS-resolution pinning or network egress policy.
  Run the API with an egress allow-list/firewall for defence in depth.
- **Key management** — job payloads use application encryption with a static
  Fernet key from the environment. There is no KMS/HSM integration, automatic
  rotation, or envelope re-encryption job yet.
- **Encryption at rest** — database/volume encryption remains the deployment
  platform's responsibility; application encryption covers queued job payloads
  only.
- **Background worker scale-out** — jobs are safe for one worker. Multiple
  workers can race on PostgreSQL unless selected with row locks; deploy one
  worker or add `SKIP LOCKED` leasing before scaling out.
- **Retention completeness** — the worker can enqueue per-workspace audit
  retention when enabled. Investigation/evidence soft-delete and a full data
  retention matrix are still to be completed.
- **Prompt isolation** — the model is instructed to treat evidence as untrusted
  and has no tools, but model output is still untrusted text and must be
  validated before display. No agentic execution path exists.
- **Browser E2E** — the release gate uses backend tests, frontend lint/build, and
  dependency-free HTTP route smoke. Public auth/recovery/OAuth pages have no
  browser automation yet; a browser runner needs an explicit dependency decision.
- **Secret rotation** — previously exposed GitHub/OpenRouter credentials must be
  revoked and replaced before live verification.

## Secret handling rules

1. Never commit `.env` files or real credentials. `.gitignore` excludes them.
2. `.env.example` contains placeholders only.
3. Never log secrets; redaction is defence-in-depth, not a licence to log them.
4. Never return credentials, tokens, or connection secrets in API responses.
5. Prefer short-lived, least-privilege, read-only credentials.
6. Rotate any credential that has appeared in chat, logs, or a public artifact.
7. `AI_PRIVACY_MODE=true` or the per-tenant override must prevent any external
   LLM transmission.

## Read-only by default

- Integrations default to disabled.
- Kubernetes access must use least-privilege read-only RBAC (no cluster-admin).
- GitHub access must use a fine-grained token with `Actions: read`,
  `Contents: read`, and `Metadata: read` only. Never grant write scopes.
- No endpoint may create, delete, patch, restart, or scale resources as part of
  diagnosis. Infrastructure-changing actions require an explicit human approval
  workflow that is not implemented here.
- Terraform review parses supplied JSON only; it never reads state or applies a
  plan. Values are omitted from responses and evidence.
- Infrastructure-code generation returns proposals only; it never writes to a
  repository or cluster.
- Prometheus access is query-only.

## Reporting a vulnerability

Report suspected issues privately to the maintainers. Do not include
credentials in reports. Include reproduction steps and affected versions.
