# Workspaces — membership, invites, and hard isolation

A workspace is the tenant boundary. Every request resolves to exactly one
workspace and every query is scoped to it. A user in workspace A cannot read,
write, update or delete any row owned by workspace B through the API, a
token, a URL or body parameter, an export, or an error message.

## Data model

- `workspaces` — id, slug (unique), name, settings JSON, timestamps.
- `workspace_members` — workspace_id + user_id (unique together), role CHECK
  in (owner, admin, member, viewer).
- `workspace_invites` — workspace_id, email, role, `token_hash` (unique),
  invited_by, expires_at, accepted_at.
- Every customer-data table (`conversations`, `messages`, `integrations`,
  `investigations`, `evidence`, `audit_events`) carries `workspace_id`
  NOT NULL with `ON DELETE CASCADE`. `users`, `sessions`, and the workspace
  tables themselves do not.
- Slugs come from the user's name or email local part, lowercased, with a
  numeric suffix on collision. There are no fixed "default"/"personal" slugs.
- Two memberless system workspaces exist for audit rows that have no user:
  `quarantine` (unattributable legacy rows) and `system` (events with no
  user at all). Nobody is a member, so their rows are unreachable through
  the workspace API.

## Request resolution

`get_current_workspace` resolves in order: `{workspace_slug}` in the URL →
`X-Workspace-Id` header → the user's only workspace → 400
`workspace_not_selected`. Membership is verified afterwards. A non-member
and a nonexistent workspace return the identical 404
(`workspace_not_found`). A member whose role lacks a permission gets 403.
A workspace id in a request body or query string is never trusted.

## Roles and permissions

The single matrix lives in `backend/app/auth/permissions.py`
(`PERMISSIONS` + `has_permission`). No other module compares role strings.

| Permission | Roles |
| --- | --- |
| workspace.delete / transfer_ownership / manage_billing | owner |
| workspace.manage_members / manage_settings | owner, admin |
| investigation.create, investigation.read_all | owner, admin, member |
| integration.connect / disconnect, audit.export, conversation.create | owner, admin, member |
| investigation.read, audit.read, kubernetes.read/diagnose, member.read, conversation.read | owner, admin, member, viewer |

Last-owner and last-admin protection: the last owner (and an owner-less last
admin) cannot be removed or demoted.

## API

Canonical scoped routes: `/api/v1/workspaces/{slug}/...` — workspace CRUD,
`/members`, `/invites`, plus scoped `investigations`, `audit-events`, and
`kubernetes` surfaces. Invite acceptance is
`POST /api/v1/invites/{token}/accept` (authenticated, email must match,
single-use, expiring, hashed at rest).

Legacy unprefixed routes keep working only when the workspace resolves from
the `X-Workspace-Id` header or the user's single workspace, and log a
deprecation warning. Signup creates a personal workspace and returns its
slug.

## Repositories

All workspace-scoped reads and writes go through
`backend/app/repositories/`. Every method takes `workspace_id` as a required
keyword-only argument with no default, so a forgotten argument is a
`TypeError`, not a leak. `tests/unit/test_repository_scoping.py` parses
`app/api/v1/` and `app/services/` with `ast` and fails if a scoped model is
queried without a `workspace_id` filter.

## Tests

- `tests/unit/test_permissions.py` — every role × permission pair.
- `tests/unit/test_repository_scoping.py` — the AST guard.
- `tests/integration/test_workspaces_api.py` — CRUD, members, invites.
- `tests/integration/test_workspace_isolation.py` — the core isolation
  deliverable (cross-workspace reads/writes, byte-identical 404s, schema
  walk, injected workspace ids).
- `tests/integration/test_migrations.py` and
  `tests/unit/test_local_schema.py` — empty and populated databases.

## Per-workspace Kubernetes clusters ("bring your own cluster")

Every workspace can connect its **own** clusters instead of relying on the
deployment's shared, operator-configured ones:

- `POST /api/v1/workspaces/{slug}/kubernetes/integrations` — paste a
  kubeconfig (permission `integration.connect`). The kubeconfig is validated,
  **encrypted at rest** (`CREDENTIAL_ENCRYPTION_KEY`), and never returned by
  any API.
- `GET …/kubernetes/integrations` — metadata only (name, context, API server).
- `POST …/kubernetes/integrations/{id}/verify` — live read-only reachability
  probe; returns a structured `{ok, namespaces | error}` result.
- `DELETE …/kubernetes/integrations/{id}` — disconnect (`integration.disconnect`).

Once a workspace has a connected cluster, all scoped Kubernetes routes
(clusters, namespaces, workloads, pods, logs, diagnose) resolve the client
from **that** credential. A workspace with no connected cluster falls back to
the shared env-configured clusters (`KUBERNETES_KUBECONFIG` /
`KUBERNETES_CLUSTERS`), preserving the single-operator model. Clusters of one
workspace are invisible to another (same 404 rules as all workspace data).
UI: `/w/<slug>/kubernetes`.

## Frontend

Product routes live under `/w/[slug]/...` (dashboard, members, settings).
`/workspaces` lists them, `/workspaces/new` creates one, `/invite/[token]`
accepts an invite, and the workspace switcher in the top nav navigates by
URL. The URL is the only source of truth for the active workspace.
