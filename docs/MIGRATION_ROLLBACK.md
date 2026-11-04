# Migration rollback — workspace isolation (0011–0013)

Read this before running the workspace migrations in production.

## Before upgrading

Dump the database so a rollback never depends on `alembic downgrade`:

```bash
# Postgres
pg_dump --format=custom --file=sre-copilot-pre-workspaces.dump "$DATABASE_URL"

# SQLite (local)
cp ./sre_copilot.db ./sre_copilot.db.bak-pre-workspaces
```

Verify the dump restores into a scratch database before touching production:

```bash
createdb sre_copilot_restore_check
pg_restore --dbname=sre_copilot_restore_check sre-copilot-pre-workspaces.dump
```

## Upgrade

```bash
alembic upgrade head
```

Migrations 0011–0013 are additive and copy-only. 0011 creates the three
workspace tables and nullable `workspace_id` columns; 0012 backfills one
personal workspace per user and stamps owned rows; 0013 parks unattributable
rows in a memberless `quarantine` workspace (counts logged) and enforces
`NOT NULL`. No rows are ever deleted.

## Restore (full rollback)

```bash
# Postgres
dropdb sre_copilot && createdb sre_copilot
pg_restore --dbname=sre_copilot --no-owner sre-copilot-pre-workspaces.dump

# SQLite (local)
cp ./sre_copilot.db.bak-pre-workspaces ./sre_copilot.db
```

## Partial rollback (schema only)

`alembic downgrade 0010_session_last_used_not_null` reverses 0013 (columns
back to nullable), 0012 (no-op — the backfill is copy-only) and 0011 (drops
the `workspace_id` columns and the three workspace tables). Data written to
`workspace_id` columns since the upgrade is discarded by that downgrade —
another reason the dump is the primary rollback path.
