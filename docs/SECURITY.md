# Security

> **Honest status.** Local authentication now includes Argon2id password
> hashing, password policy, email verification and recovery hooks, account
> lockout, rotating opaque sessions, CSRF double-submit protection, optional
> Google/GitHub OAuth, organizations, role-based authorization, and tenant-scoped
> audit records. Shared rate limiting, dependency/image scanning, a complete
> SSRF review, prompt-injection regression coverage, and application-level
> encryption/key management remain open. Do not expose the API to untrusted
> networks until the release checklist and the "Remaining controls" below are
> complete.

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
| Request size limit | `app/core/ratelimit.py` | `MAX_REQUEST_BYTES` (default 2 MB). |
| Rate limiting | `app/core/ratelimit.py` | In-memory sliding window; disabled locally by default, production defaults to 120/min. |
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
- Set an explicit `RATE_LIMIT_PER_MINUTE` if 120/min is not appropriate.
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

- **Shared rate limiting** — the current limiter is per-process/in-memory; a
  multi-instance deployment should use Redis or an edge limiter.
- **Dependency and image scanning** — not wired into CI yet.
- **Distributed auth rate limits** — per-account lockout is durable, but IP-level
  throttling remains per process. Use an edge/Redis limiter for multi-instance
  deployments.
- **SSRF review** — integration endpoints use configured server-side URLs, and
  OAuth uses fixed provider hosts. A comprehensive egress-address policy and
  metadata-endpoint denial still need to be implemented and tested.
- **Prompt-injection defences** — AI providers receive only redacted evidence
  summaries, but logs and summaries are untrusted data. Regression tests and
  stronger isolation are still needed.
- **Encryption at rest / key management** — delegated to the database and
  deployment platform; no application-level envelope encryption.
- **Retention scheduling** — retention can be applied by an admin, but there is
  no scheduler/worker yet.
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
