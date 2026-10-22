# Backend Security Review

## Finding

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | HIGH | `backend/app/api/v1/auth.py`, `backend/app/services/auth.py` | `auth.py` 46–64; `auth.py` 47–58 | Unauthenticated public signup could acquire administrator privileges by registering first or claiming the configured bootstrap-admin email. | 9/10 |

### Impact

An attacker could register before the intended operator, or claim the
unverified bootstrap email, and gain access to administrator-only account and
tenant operations.

### Fix applied

- Public signups now always create `member` accounts.
- Removed email-based promotion at startup and first-user promotion from local
  schema upgrades and fresh role migrations.
- Added `backend/scripts/set_admin.py` for administrators to promote or
  explicitly demote accounts from a trusted local shell.
- Added regression coverage for the signup privilege boundary and documented
  the admin provisioning procedure.

Existing installations retain administrator roles already persisted by older
versions. Operators must review those roles after upgrade and demote any
account that was not deliberately authorized.

## Verification

- Backend test suite: 184 passed.
- Backend Ruff: passed.
- Frontend ESLint, TypeScript check, and production build: passed.
