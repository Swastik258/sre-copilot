#!/usr/bin/env sh
# Restore a PostgreSQL custom dump or SQLite backup.
#
# This is destructive. It refuses to run without CONFIRM_RESTORE=yes, and it
# refuses a production target unless ALLOW_PRODUCTION_RESTORE=yes is also set.
# Stop application writers first and take a fresh backup before restoring.
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"
if [ "${CONFIRM_RESTORE:-}" != "yes" ]; then
  echo "Refusing destructive restore. Set CONFIRM_RESTORE=yes after review." >&2
  exit 1
fi
if [ "${ENVIRONMENT:-local}" = "production" ] && [ "${ALLOW_PRODUCTION_RESTORE:-}" != "yes" ]; then
  echo "Refusing production restore without ALLOW_PRODUCTION_RESTORE=yes." >&2
  exit 1
fi
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi
if [ -f "$BACKUP_FILE.sha256" ]; then
  sha256sum --check "$BACKUP_FILE.sha256"
fi

case "$DATABASE_URL" in
  sqlite:///*)
    target="${DATABASE_URL#sqlite:///}"
    sqlite3 "$BACKUP_FILE" ".restore '$target'"
    echo "SQLite database restored from $BACKUP_FILE"
    ;;
  postgresql://*|postgresql+psycopg://*)
    pg_url="${DATABASE_URL/postgresql+psycopg/postgresql}"
    pg_restore --dbname="$pg_url" --clean --if-exists --no-owner --no-acl "$BACKUP_FILE"
    echo "PostgreSQL database restored from $BACKUP_FILE"
    ;;
  *)
    echo "Unsupported DATABASE_URL scheme" >&2
    exit 1
    ;;
esac
