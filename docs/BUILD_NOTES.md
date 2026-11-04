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

Resolution status after the verify-and-fix pass (all steps executed in-container; real `dev.db` drill still runs on the operator machine):

1. ~~Nothing executed~~ **Resolved** — import, ruff, migrations (empty + populated SQLite), unit 246, milestone selection 112, full suite 373/373, npm lint + build all pass.
2. ~~`tometadata` batch alter~~ **Resolved** — implemented as full-metadata clone via `Table.to_metadata()`; batch recreates succeed on SQLite.
3. ~~`PRAGMA foreign_keys` during batch alter~~ **Resolved empirically** — batch recreates succeeded with inbound FKs present.
4. `json.dumps({})` bound into a Postgres `JSON` column via raw SQL — **still open** (SQLite path verified; verify on Postgres during deploy).
5. ~~`test_local_schema` expected lists~~ **Resolved** — tests updated and passing.
6. ~~`rowcount` on `exec_driver_sql`~~ **Resolved** — quarantine counts logged correctly.
7. ~~Next 16 docs unread~~ **Resolved** — `node_modules` installed; `npm run lint` and `npm run build` pass; all new routes compile.
8. Phase 4/5 additions (extra permissions, memberless `system` workspace, `record_event` auto-resolution) — validated by the suite.
9. Memberless `quarantine`/`system` workspaces — validated (quarantine memberless; system unreachable).
10. `integrations` table unused by routers — stands; slug-migration unnecessary.

### Fix-pass findings (this pass)

- `0011` had Python syntax errors (`ForeignKey` after kwargs) and the batch `create_foreign_key` signature was wrong — would have crashed every upgrade; fixed.
- FastAPI cannot resolve a plain `WorkspaceContext` parameter: replaced per-route context dependencies with one request-aware, cached `_resolve_any` resolver.
- `accept_invite` compared naive SQLite datetimes to aware `now()` — fixed with `_as_aware`.
- Investigations repository lacked the `user_id` filter (member self-scoping 500) — fixed.
- `audit.retention` job still used the old `apply_retention` signature and tenant payloads — handler + scheduler now workspace-scoped; legacy payloads are skipped with a logged warning (never cross-workspace deletes).
- Pre-existing, unrelated to the milestone: `test_health`/`test_config`/AI-dependent tests were mutually inconsistent at the base commit (config default flipped to `groq` in `70975aa` without updating tests). Resolved by pinning `AI_PROVIDER=mock` for the test session, isolating the defaults test from ambient env, and asserting health wiring against the configured provider.
7. `frontend/node_modules` is not installed, so the bundled Next 16.4 docs (`node_modules/next/dist/docs/`) could not be read before writing frontend code. All new pages are conservative client components using `useParams()`; nothing was verified against Next 16 conventions.
8. Phase 4/5 additions beyond the original matrix: permissions `conversation.read/create`, `audit.read/export/read_all`, `kubernetes.read`, `member.read`, `invite.manage`, `investigation.read_all`; memberless `system` workspace for user-less audit events; `record_event` auto-resolves `workspace_id` (explicit in scoped callers) so all 29 legacy call sites keep working.
9. Legacy unprefixed `/investigations`, `/audit-events`, `/kubernetes` routes now require a session (workspace resolution) — `tests/integration/test_kubernetes_api.py` gained an autouse signup fixture.
10. Kubernetes diagnosis builds evidence as schema objects only (no DB writes); `integrations` table is not used by any router, so it was not migrated to `{slug}` routes.
