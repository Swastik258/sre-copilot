# Build notes — multi-tenant workspaces

Running status for the workspace isolation milestone. Updated per phase.

## Phase status

| Phase | Status |
| --- | --- |
| 1. Models, migrations A–C, local_schema, migration tests | done (code + tests written; unrun) |
| 2. permissions.py, workspace deps, test_permissions | done (written; unrun) |
| 3. Repositories, workspace_service, scoping test | done (written; unrun) |
| 4. Workspace/member/invite endpoints, signup | done (written; unrun) |
| 5. Migrate existing routers to {slug} | done (written; unrun) |
| 6. test_workspace_isolation.py | done (written; unrun) |
| 7. Frontend + docs | done (written; unrun — Next 16 docs unread, see Unverified 7) |

## Phase 1 — assumptions

- `workspaces.id`/`workspace_members`/`workspace_invites` keys are `VARCHAR(36)` UUID strings, matching every existing table (no native UUID type anywhere in this schema).
- `workspace_id` is NOT NULL on `conversations`, `messages`, `integrations`, `investigations`, `evidence`, `audit_events` (final state; models updated to match).
- Existing `tenant_id` columns on `users`/`investigations`/`audit_events` (NOT NULL, default `'default'`, no FK — migration 0005) are left in place this phase; mapping to `workspace_id` happens when routers move in phase 5.
- `integrations` and `evidence` have no `user_id` column: evidence is attributed via its parent `investigation`; integrations are unattributable and get quarantined.
- Quarantine workspace: slug `quarantine`, memberless, created only when unattributable rows exist; counts logged via `alembic.runtime.migration` logger.
- No persistent column default for `workspace_id` anywhere (models, 0011, local_schema).
- SQLite batch alter: replacement table built from model metadata (`Table.tometadata`), indexes recreated from reflection, workspace index added with the `ix_<table>_workspace_id` naming convention.
- `users` table gains no workspace column; membership is the only link.

## Unverified (numbered, running)

1. No Python runtime in this container — nothing has been executed; all gates (`ruff`, `pytest`, `alembic upgrade`, `npm`) must run in the user's environment.
2. `Table.tometadata()` + `spec.name = ...` rename + `spec.indexes.clear()` for the SQLite batch alter — assumed to compile DDL under the temp name; not executed.
3. `PRAGMA foreign_keys` assumed OFF during local upgrades (SQLAlchemy default) so dropping a referenced table during batch alter is safe; `app/db/session.py` not yet inspected for a pragma event.
4. `json.dumps({})` bound into a Postgres `JSON` column via raw SQL — assumed to coerce; untested.
5. Exact list expectations in `tests/unit/test_local_schema.py` updated by hand to include workspace entries; not run.
6. `result.rowcount` on `exec_driver_sql` UPDATE assumed reliable on SQLite and Postgres.
7. `frontend/node_modules` is not installed, so the bundled Next 16.4 docs (`node_modules/next/dist/docs/`) could not be read before writing frontend code. All new pages are conservative client components using `useParams()`; nothing was verified against Next 16 conventions.
8. Phase 4/5 additions beyond the original matrix: permissions `conversation.read/create`, `audit.read/export/read_all`, `kubernetes.read`, `member.read`, `invite.manage`, `investigation.read_all`; memberless `system` workspace for user-less audit events; `record_event` auto-resolves `workspace_id` (explicit in scoped callers) so all 29 legacy call sites keep working.
9. Legacy unprefixed `/investigations`, `/audit-events`, `/kubernetes` routes now require a session (workspace resolution) — `tests/integration/test_kubernetes_api.py` gained an autouse signup fixture.
10. Kubernetes diagnosis builds evidence as schema objects only (no DB writes); `integrations` table is not used by any router, so it was not migrated to `{slug}` routes.
