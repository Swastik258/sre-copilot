# Security

> **Honest status.** The project is *not* production-secure. Authentication,
> authorization, tenant isolation, and several hardening controls are **not yet
> implemented**. This document states what exists, what is missing, and the
> threat model the project is being built toward. Do not expose the API to
> untrusted networks until the "Missing" items are addressed and verified.

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

Design responses: read-only-by-default, redaction, privacy mode, evidence
provenance, approval workflow, and audit logging.

## Implemented controls

| Control | Where | Notes |
|---------|-------|-------|
| Secret redaction | `app/core/redaction.py` | Best-effort denylist + `key=value`; applied to logs, evidence, audit. |
| Log redaction filter | `app/core/logging.py` | Redacts formatted records before emission. |
| Correlation IDs | `app/core/request_context.py` | `X-Request-ID` on every request/response. |
| Consistent error envelope | `app/core/errors.py` | Internal errors never leak stack traces to clients. |
| Request size limit | `app/core/ratelimit.py` | `MAX_REQUEST_BYTES` (default 2 MB). |
| Rate limiting | `app/core/ratelimit.py` | In-memory sliding window; **disabled by default** (`RATE_LIMIT_PER_MINUTE=0`). |
| CORS allowlist | `app/main.py` | Explicit origins; methods/headers enumerated. |
| Integration status without secrets | `app/services/integrations.py` | Reports configuration state only; never returns tokens. |
| Demo labelling | `schemas/evidence.py`, frontend | Fixture data flagged `demo=true`. |
| Audit events | `app/services/audit.py` | Redacted resource/outcome payloads. |
| Account passwords | `app/security/passwords.py` | scrypt (per-user salt, 16-byte, `n=2^14`), constant-time compare; PBKDF2 fallback. |
| Local signup/login | `app/services/auth.py`, `app/api/v1/auth.py` | Self-hosted accounts; the session token is never returned in a body. |
| Session tokens | `app/security/tokens.py` | 256-bit `secrets.token_urlsafe`; only the SHA-256 hash is stored. |
| Session cookie | `app/api/v1/auth.py` | `HttpOnly`, `SameSite=Lax` (blocks cross-site POST CSRF), `Secure` off-server, 7-day TTL, revocable. |
| Optional API enforcement | `app/api/v1/router.py` (`AUTH_REQUIRED`) | **Off by default**; when on, read-only routes require a session (health/auth stay public). |

## Missing controls (must be implemented before public exposure)

- **Authentication & authorization** — local signup/login now exists
  (`app/api/v1/auth.py`) with hashed passwords and server-side sessions, but it is
  **not enforced by default**: `AUTH_REQUIRED` is off so the demo and tests run
  without credentials. There is no authorization model (roles/permissions) and no
  verified identity on routes when the flag is off.
- **Tenant/organization isolation** — no enforced data boundaries.
- **CSRF/SSRF/command-injection hardening** — no URL-fetching features exist
  yet, but must be reviewed as adapters land.
- **Persistent, shared rate limiting** — current limiter is per-process and
  in-memory.
- **Dependency & image scanning** — not wired into CI yet.
- **Prompt-injection defences** — no AI provider is implemented yet, so no
  untrusted content reaches a model. This must be addressed with Module H.
- **Encryption at rest / key management** — relies on the database layer.
- **Retention & deletion controls** — not implemented.

## Secret handling rules

1. Never commit `.env` files or real credentials. `.gitignore` excludes them.
2. `.env.example` contains placeholders only.
3. Never log secrets; redaction is defence-in-depth, not a licence to log them.
4. Never return credentials, tokens, or connection secrets in API responses.
5. Prefer short-lived, least-privilege, read-only credentials.
6. `AI_PRIVACY_MODE=true` must prevent any external LLM transmission.

## Read-only by default

- Integrations default to disabled.
- Kubernetes access must use least-privilege read-only RBAC (no cluster-admin).
- No endpoint may create, delete, patch, restart, or scale resources as part of
  diagnosis. Infrastructure-changing actions require the explicit approval
  workflow (not yet implemented).

## Reporting a vulnerability

Report suspected issues privately to the maintainers. Do not include
credentials in reports. Please include reproduction steps and affected versions.
