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

# Demo mode (no auth): point at the backend
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000. With no `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, the app
runs without sign-in and without any third-party credentials.

### Optional authentication (Clerk)

Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to enable Clerk
sign-in. This affects the **UI only**; the backend does not verify tokens yet
(see docs/SECURITY.md).

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
