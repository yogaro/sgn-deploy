# Postgres with the SGN init baked in, for stack deploys that get no files next to the compose file.
# Build from the workspace root: docker build -f docker/postgres/Dockerfile -t sgn-postgres .
FROM postgres:17-alpine
COPY docker/postgres/initdb/ /docker-entrypoint-initdb.d/
COPY sgn-directory-service/migrations/ /migrations/directory/
COPY docker/postgres/bootstrap.sh /usr/local/bin/sgn-bootstrap
