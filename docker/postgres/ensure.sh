#!/bin/sh
# Runs beside Postgres on every start (sgn-postgres image) and brings the cluster up to date: creates the four databases
# that are missing and applies the Directory migrations not yet recorded. Unlike /docker-entrypoint-initdb.d, which runs
# only on an empty volume, this also repairs a volume whose first initialisation was cut off.
set -eu
export PGHOST=${PGHOST:-127.0.0.1} PGUSER=${POSTGRES_USER:-postgres} PGPASSWORD=${POSTGRES_PASSWORD:-}
export PGOPTIONS='-c client_min_messages=warning'
dir=${DIRECTORY_MIGRATIONS:-/migrations/directory}
q() { psql -v ON_ERROR_STOP=1 -qtA "$@"; }

# The temporary server of a first initialisation listens on the socket only, so TCP means the real server is up.
until pg_isready -q -d postgres; do sleep 2; done

for db in db_iam db_hr db_lms db_directory; do
  if ! q -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1; then
    q -d postgres -c "CREATE DATABASE $db"
    echo "sgn: created $db"
  fi
done

q -d db_directory -c "CREATE TABLE IF NOT EXISTS public.sgn_directory_migrations (
  filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
# A schema built by the old init scripts has no record yet: it holds every migration shipped in this image.
if [ "$(q -d db_directory -c 'SELECT count(*) FROM public.sgn_directory_migrations')" = 0 ] &&
  q -d db_directory -c "SELECT to_regclass('public.service_clients') IS NOT NULL" | grep -q t; then
  for f in "$dir"/*.sql; do
    q -d db_directory -c "INSERT INTO public.sgn_directory_migrations (filename) VALUES ('$(basename "$f")')"
  done
fi
for f in "$dir"/*.sql; do
  name=$(basename "$f")
  q -d db_directory -c "SELECT 1 FROM public.sgn_directory_migrations WHERE filename = '$name'" | grep -q 1 && continue
  echo "sgn: directory applying $name"
  q -d db_directory -f "$f" >/dev/null
  q -d db_directory -c "INSERT INTO public.sgn_directory_migrations (filename) VALUES ('$name')"
done
echo "sgn: databases ready"
