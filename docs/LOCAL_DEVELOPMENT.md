# Local development

## Prerequisites

- Python 3.11+ (CI uses 3.12)
- Node.js 20+
- Optional: Docker + Docker Compose (for Postgres)

No cloud accounts, API keys, or clusters are required for local development.

## Backend

```bash
cd backend
python -m venv .venv
. .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

# Optional configuration (defaults already work for local):
cp ../.env.example .env

# Run
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health
- The SQLite schema is created automatically when `ENVIRONMENT=local` and the
  database URL is SQLite.

### Local database from an older milestone

`create_all()` creates missing tables but never adds a column to an existing
table. On startup the backend therefore applies additive upgrades to a local
SQLite file (currently `users.password_hash` and the unique `users.email`
index), so a database created before the auth milestone keeps working. Look for
this line in the log:

```
Upgraded local SQLite schema: users.password_hash, ix_users_email
```

If the upgrade logs a duplicate-email warning, delete the local SQLite file
(demo data only) or remove the duplicate rows, then restart. Postgres and any
non-local environment are never altered this way — use the migrations below.

### Migrations

```bash
cd backend
alembic upgrade head                       # apply migrations
alembic revision --autogenerate -m "msg"   # create a new revision
alembic downgrade -1                       # roll back one revision
```

Postgres deployments always use migrations (SQLite auto-create is local-only).

## Frontend

```bash
cd frontend
npm install

# Demo mode: point at the backend
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000. Signup and sign-in are self-hosted: accounts and
sessions live in the backend (`/api/v1/auth/*`), passwords are hashed with
scrypt, and the session is carried in an `HttpOnly` cookie. After signing in you
land on `/dashboard`. No third-party credentials are required.

### Optional: API-wide enforcement

Authentication is **not enforced by default** so the demo and tests run without
credentials. Set `AUTH_REQUIRED=true` on the backend to require a valid session
on the read-only routes (`/api/v1/integrations`, `/api/v1/kubernetes/*`); health
and `/api/v1/auth/*` stay public. See docs/SECURITY.md.

### Optional: Clerk

Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to use Clerk's
sign-in/sign-up modals in the navigation instead of the local auth pages. This
affects the **UI only**.

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

## Troubleshooting

- **"Cannot reach the API"** in the UI — the backend is not running or
  `NEXT_PUBLIC_API_URL` is wrong. `NEXT_PUBLIC_*` values are baked at build time;
  rebuild after changing them.
- **CORS errors** — set `CORS_ORIGINS` to include the frontend origin.
- **Empty database** — run `alembic upgrade head`, or ensure
  `AUTO_CREATE_SCHEMA=true` for local SQLite.
- **Frontend build fails without Clerk** — this should not happen; Clerk is
  optional. If it does, ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset.
