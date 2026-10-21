# Local development

## Prerequisites

- Python 3.11+ (CI uses 3.12)
- Node.js 20+
- Optional: Docker + Docker Compose (for Postgres)
- Optional: a read-only kubeconfig, GitHub token, Prometheus URL, or AI key for
  live integrations

No cloud accounts or credentials are required for demo mode.

## Backend

```bash
cd backend
python -m venv .venv
. .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

# Optional configuration (defaults already work locally):
cp ../.env.example .env

uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health
- SQLite schema is created automatically for local SQLite. Postgres uses Alembic.

### Accounts, roles, and tenants

Signup and sign-in are self-hosted. The **first local account becomes an admin**;
later accounts are members in `DEFAULT_TENANT_ID`. When an older database is
upgraded, the earliest existing account is promoted to admin so the workspace
cannot be left without an administrator. To promote a specific account
in an existing database, set:

```dotenv
BOOTSTRAP_ADMIN_EMAIL=you@example.com
```

The backend promotes that active account on startup (and applies it to a new
signup), then the setting can be removed. Admins can manage users and tenants
from `/settings` or via `/api/v1/admin/*`. The last active admin cannot be
demoted or deactivated. Moving a member migrates their investigations. Settings
and audit views are tenant-scoped.

### Authentication enforcement

`AUTH_REQUIRED=false` is the local demo default. Set `AUTH_REQUIRED=true` in
shared environments. `ENVIRONMENT=production` always enforces authentication,
even if the flag is unset. Production also defaults to 120 requests/minute when
`RATE_LIMIT_PER_MINUTE=0`.

### Local database from an older milestone

`create_all()` creates missing tables but never adds a column to an existing
table. On startup the backend applies additive upgrades to local SQLite files,
including `users.password_hash`, `users.role`, `users.tenant_id`,
`investigations.tenant_id`, `audit_events.tenant_id`, and the unique email index.
Look for a log line such as:

```
Upgraded local SQLite schema: users.password_hash, users.role, users.tenant_id, users.role(admin)
```

If an upgrade logs a duplicate-email warning, delete the local SQLite file (demo
data only) or remove duplicate rows, then restart. Non-local environments use
Alembic and are never altered this way.

### Migrations

```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "msg"
alembic downgrade -1
```

## Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000. Accounts and sessions live in the backend; the
session is carried in an `HttpOnly` cookie. After signing in you land on
`/dashboard`.

Live product pages: `/kubernetes`, `/cicd`, `/terraform`, `/logs`, `/assistant`,
`/metrics`, `/runbooks`, `/audit`, `/settings`, and `/infra-code`.

### Clerk status

Clerk is **not used by the UI**. The `@clerk/nextjs` package remains in
`package.json`, but no component imports it and there is no Clerk provider or
modal. Use the self-hosted `/sign-up` and `/login` pages. `lib/auth.ts` is a
legacy configuration shim and is not part of the authentication flow.

## Optional live integrations

### Kubernetes

Set `KUBERNETES_ENABLED=true`, `KUBERNETES_DEMO_MODE=false`, and either the legacy
single-target settings or `KUBERNETES_CLUSTERS` for named clusters. Use Windows
paths such as `C:/Users/you/.kube/kind-config` on Windows. See
[docs/KUBERNETES_SETUP.md](KUBERNETES_SETUP.md).

### GitHub Actions

Set `GITHUB_ENABLED=true` and a fine-grained read-only `GITHUB_TOKEN`, then open
`/cicd`. Use `Actions: read`, `Contents: read`, and `Metadata: read` only. See
[docs/GITHUB_SETUP.md](GITHUB_SETUP.md).

### Terraform

Open `/terraform` and paste/upload the output of `terraform show -json tfplan`.
No backend credentials are required. Attribute values are omitted. See
[docs/TERRAFORM_REVIEW.md](TERRAFORM_REVIEW.md).

### Prometheus

Set `PROMETHEUS_ENABLED=true` and `PROMETHEUS_URL=http://localhost:9090`, or use
fixture mode with `PROMETHEUS_URL=` and `PROMETHEUS_DEMO_MODE=true`. See
[docs/PROMETHEUS_SETUP.md](PROMETHEUS_SETUP.md).

### AI

The default `AI_PROVIDER=mock` makes no external calls. For OpenRouter:

```dotenv
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Anthropic (`AI_PROVIDER=anthropic`) uses the native Messages API. Keep all keys
server-side. See [docs/AI_PROVIDERS.md](AI_PROVIDERS.md).

## Docker Compose

```bash
cp .env.example .env
docker compose -f deploy/docker-compose.yml up --build
```

Services: Postgres (`db`), backend (migrates then serves on 8000), frontend on
3000.

## Useful commands

| Command | Purpose |
|---------|---------|
| `uvicorn app.main:app --reload` | Run backend |
| `pytest` | Backend tests |
| `ruff check .` | Backend lint |
| `alembic upgrade head` | Apply migrations |
| `npm run dev` | Run frontend |
| `npm run lint` | Frontend lint |
| `npm run build` | Frontend production build |
| `npm run start` | Start production build |
| `npm run smoke` | HTTP route smoke against `RELEASE_BASE_URL` |

## Troubleshooting

- **"Cannot reach the API"** — the backend is not running or
  `NEXT_PUBLIC_API_URL` is wrong. `NEXT_PUBLIC_*` values are baked at build time;
  rebuild after changing them.
- **CORS errors** — set `CORS_ORIGINS` to include the frontend origin.
- **Empty database** — run `alembic upgrade head`, or ensure
  `AUTO_CREATE_SCHEMA=true` for local SQLite.
- **Cannot stay signed in** — check `CORS_ORIGINS`, the `HttpOnly` cookie, and
  that the frontend/backend origins match. Clerk environment variables are not
  used.
- **403 on settings/audit retention** — the signed-in account is a member. Ask
  an admin, or set `BOOTSTRAP_ADMIN_EMAIL` for the account before restarting.
