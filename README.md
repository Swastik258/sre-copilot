# SRE Copilot

Initial project scaffold for an SRE Copilot web application.

## Project layout

- `backend/` — Python API and Alembic migration configuration.
- `frontend/` — Next.js application and shared components.
- `deploy/docker-compose.yml` — local PostgreSQL, API, and web services.

## Local development

Copy `.env.example` to `.env`, then run `docker compose -f deploy/docker-compose.yml up --build` from the repository root. The API health endpoint is available at `http://localhost:8000/health`; the web application is at `http://localhost:3000`.

This scaffold contains no production secrets. Replace the example database password before using it outside local development.
