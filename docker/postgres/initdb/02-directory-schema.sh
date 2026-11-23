#!/bin/sh
# The directory service has no migrate command, so a fresh volume gets its migrations here, in order.
set -eu
for f in /migrations/directory/*.sql; do
  echo "directory: applying $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d db_directory -f "$f"
done
