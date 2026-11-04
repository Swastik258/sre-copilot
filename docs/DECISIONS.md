# Workspace isolation — decisions

- **Workspaces vs organizations.** The pre-existing `organizations` /
  `organization_memberships` tables stay: billing (`usage_events`,
  `subscriptions`) and the admin tenancy UI are keyed on them. The isolation
  boundary is the new `workspaces` / `workspace_members` /
  `workspace_invites` set, which satisfies the milestone's stricter contract
  (unique NOT NULL slug, settings JSON, role CHECK, invite tokens as hashes).
  Consolidating billing onto workspaces is deferred, not forgotten.
- **`tenant_id` stays on `users`/`investigations`/`audit_events`.** Legacy
  columns from migration 0005 (NOT NULL, default `'default'`, no FK). New
  writes prefer `workspace_id`; the legacy columns are populated only by
  `record_event`'s default. Removing them is a later cleanup.
- **No persistent column default for `workspace_id`.** Migrations add the
  column nullable, backfill it, then enforce NOT NULL. SQLite cannot ALTER a
  column to NOT NULL, so `local_schema.py` recreates stale tables from the
  model metadata (batch alter) — never with a `DEFAULT` on the column.
- **Unattributable rows are quarantined, not deleted.** Rows that migration
  B cannot attribute (audit events with no user; global integration rows) go
  to a memberless `quarantine` workspace in migration C, with counts logged.
  Audit events with neither user nor workspace land in a memberless `system`
  workspace. Neither is reachable through the workspace API.
- **`record_event` keeps a compatible signature.** `workspace_id` is optional
  on the service function and auto-resolves (actor's primary workspace →
  `system`) so all 29 legacy call sites keep working; every workspace-scoped
  caller passes it explicitly. The repository it delegates to requires
  `workspace_id` with no default.
- **404 over 403 for outsiders.** A nonexistent workspace and a workspace
  the caller is not a member of return the identical 404
  (`workspace_not_found`); 403 is reserved for members with insufficient
  role.
- **Frontend keeps one source of truth.** `/w/[slug]/...` is canonical; the
  switcher and post-signup redirect only navigate — they never authorize.
  Legacy unprefixed product pages still work against the deprecated API
  routes.
