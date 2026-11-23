#!/bin/sh
# Runs once, on an empty data volume: one database per service.
set -eu
for db in db_iam db_hr db_lms db_directory; do
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $db"
done
