# Stack variant of a backend image (RunCloud Docker Stacks): same binaries, plus sgn-start, which derives the settings
# from the shared stack environment and runs migrations before the server. Built by .github/workflows/images.yml.
#   BASE     the plain image, e.g. ghcr.io/yogaro/sgn-iam-service:run-12
#   SERVICE  iam | hr | lms | directory     ROLE  server | worker
ARG BASE
FROM ${BASE}
ARG SERVICE
ARG ROLE=server
USER root
# IAM runs the bootstrap SQL itself (psql), so the other images stay without a Postgres client.
COPY docker/postgres/bootstrap.sh /usr/local/bin/sgn-bootstrap
COPY docker/stack/entrypoint.sh /usr/local/bin/sgn-start
RUN chmod 755 /usr/local/bin/sgn-start /usr/local/bin/sgn-bootstrap \
  && if [ "$SERVICE" = iam ]; then apk add --no-cache postgresql17-client; else rm /usr/local/bin/sgn-bootstrap; fi
USER app
ENV SGN_SERVICE=${SERVICE} SGN_ROLE=${ROLE}
ENTRYPOINT ["sgn-start"]
CMD []
