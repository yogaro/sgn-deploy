# Postgres with the SGN databases and Directory schema, for stack deploys that get no files next to the compose file.
# The databases are ensured on every start (sgn-ensure-db), not by initdb scripts: a volume whose first start was cut
# off would otherwise skip them for good. Build from the workspace root: docker build -f docker/postgres/Dockerfile .
FROM postgres:17-alpine
COPY sgn-directory-service/migrations/ /migrations/directory/
COPY docker/postgres/ensure.sh /usr/local/bin/sgn-ensure-db
COPY docker/postgres/start.sh /usr/local/bin/sgn-postgres-start
COPY docker/postgres/bootstrap.sh /usr/local/bin/sgn-bootstrap
RUN chmod 755 /usr/local/bin/sgn-ensure-db /usr/local/bin/sgn-postgres-start /usr/local/bin/sgn-bootstrap
ENTRYPOINT ["sgn-postgres-start"]
CMD ["postgres"]
