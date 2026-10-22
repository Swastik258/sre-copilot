#!/usr/bin/env sh
# Create a verifiable local database backup.
#
# PostgreSQL: custom-format dump (restore with pg_restore).
# SQLite: online .backup copy (safe while the app is running).
#
# Credentials are read from DATABASE_URL/PGHOST/PGUSER/.pgpass. Never pass a
# password on the command line. Upload the resulting files to encrypted,
# access-controlled, off-host storage; this script only writes locally.
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
umask 077
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

case "$DATABASE_URL" in
  sqlite:///*)
    source_path="${DATABASE_URL#sqlite:///}"
    if [ ! -f "$source_path" ]; then
      echo "SQLite database not found: $source_path" >&2
      exit 1
    fi
    target="$BACKUP_DIR/sre-copilot-$timestamp.sqlite"
    sqlite3 "$source_path" ".backup '$target'"
    sha256sum "$target" > "$target.sha256"
    echo "Backup written: $target"
    ;;
  postgresql://*|postgresql+psycopg://*)
    pg_url="${DATABASE_URL/postgresql+psycopg/postgresql}"
    target="$BACKUP_DIR/sre-copilot-$timestamp.dump"
    pg_dump --dbname="$pg_url" --format=custom --no-owner --no-acl --file="$target"
    pg_restore --list "$target" >/dev/null
    sha256sum "$target" > "$target.sha256"
    echo "Backup written and verified: $target"
    ;;
  *)
    echo "Unsupported DATABASE_URL scheme" >&2
    exit 1
    ;;
esac

find "$BACKUP_DIR" -type f \( -name 'sre-copilot-*.dump' -o -name 'sre-copilot-*.sqlite' -o -name '*.sha256' \) \
  -mtime "+$RETENTION_DAYS" -delete
