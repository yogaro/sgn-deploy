#!/bin/sh
# Entry point of the sgn-postgres image: the usual Postgres entrypoint, with sgn-ensure-db running beside it.
sgn-ensure-db &
exec docker-entrypoint.sh "$@"
