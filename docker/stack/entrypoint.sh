#!/bin/sh
# Start script of the stack images (RunCloud Docker Stacks): one shared set of stack environment variables, and each
# image knows its own role from SGN_SERVICE (baked in). It derives the per-service settings, waits for what it needs,
# runs the migrations before the server (workers never migrate: the migrate commands take no lock), then execs.
# Usage (ENTRYPOINT of the image): sgn-start [server | worker]; without an argument SGN_ROLE (baked) decides.
set -eu
role=${1:-${SGN_ROLE:-server}}

: "${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD in the stack environment}"
export POSTGRES_USER=${POSTGRES_USER:-sgn} PGHOST=${PGHOST:-postgres} PGPORT=${PGPORT:-5432}
export PGUSER=$POSTGRES_USER PGPASSWORD=$POSTGRES_PASSWORD
db_url() { echo "postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$1?sslmode=disable"; }
IAM_URL=${IAM_URL:-http://iam:8081}
export S3_ENDPOINT=${S3_ENDPOINT:-http://s3:9000}

wait_http() {
  until wget -q -O /dev/null "$1"; do echo "waiting for $1"; sleep 3; done
}
retry() {
  until "$@"; do echo "retrying: $*"; sleep 5; done
}

case "$SGN_SERVICE" in
  iam)
    export DATABASE_URL=$(db_url db_iam) ALLOWED_ORIGIN=https://${PORTAL_DOMAIN:?set PORTAL_DOMAIN} COOKIE_SECURE=true
    export SIGNING_KEY_ID=${SIGNING_KEY_ID:-1} DIRECTORY_INTERNAL_URL=${DIRECTORY_INTERNAL_URL:-http://directory:8080}
    # The key comes from a mounted secret (SIGNING_KEY_PATH) or from IAM_SIGNING_KEY, written to a private file.
    if [ -z "${SIGNING_KEY_PATH:-}" ]; then
      umask 077
      printf %s "${IAM_SIGNING_KEY:?set IAM_SIGNING_KEY or mount a secret at SIGNING_KEY_PATH}" > /tmp/iam-signing-key
      export SIGNING_KEY_PATH=/tmp/iam-signing-key
    fi
    ;;
  hr)
    export DATABASE_URL=$(db_url db_hr) IAM_BASE_URL=$IAM_URL IAM_CLIENT_ID=svc-sgn-hr-service
    export IAM_CLIENT_SECRET=${HR_IAM_CLIENT_SECRET:?set HR_IAM_CLIENT_SECRET} ALLOWED_ORIGIN=https://${PORTAL_DOMAIN:?set PORTAL_DOMAIN}
    export S3_BUCKET=hr-files IAM_SYNC_INTERVAL=${IAM_SYNC_INTERVAL:-1h}
    ;;
  lms)
    export DATABASE_URL=$(db_url db_lms) IAM_BASE_URL=$IAM_URL IAM_CLIENT_ID=svc-sgn-lms-service
    export IAM_CLIENT_SECRET=${LMS_IAM_CLIENT_SECRET:?set LMS_IAM_CLIENT_SECRET}
    # ALLOWED_ORIGIN is also the address printed on certificate PDFs; S3_PUBLIC_URL is the host media URLs are signed for.
    export ALLOWED_ORIGIN=https://${LMS_DOMAIN:?set LMS_DOMAIN} S3_PUBLIC_URL=https://$LMS_DOMAIN
    export S3_BUCKET=lms-files IAM_SYNC_INTERVAL=${IAM_SYNC_INTERVAL:-1h}
    ;;
  directory)
    export DATABASE_URL=$(db_url db_directory) ALLOWED_ORIGIN=https://${DIRECTORY_DOMAIN:?set DIRECTORY_DOMAIN} COOKIE_SECURE=true
    ;;
  *) echo "unknown SGN_SERVICE: $SGN_SERVICE" >&2; exit 1 ;;
esac

case "$SGN_SERVICE:$role" in
  # One-off command with this service's settings, e.g. docker exec <iam container> sgn-start run sync --full.
  *:run) shift; exec "$@" ;;
  iam:server)
    retry migrate
    retry sgn-bootstrap
    exec server
    ;;
  hr:server | lms:server)
    wait_http "$IAM_URL/healthz"
    retry migrate
    exec server
    ;;
  # Workers serve /metrics on :9091 so the stack has a port to point at (RunCloud requires one per container).
  hr:worker) wait_http "${HR_URL:-http://hr:8082}/healthz"; export METRICS_ADDR=${METRICS_ADDR:-:9091}; exec worker ;;
  lms:worker) wait_http "${LMS_URL:-http://lms:8083}/healthz"; export METRICS_ADDR=${METRICS_ADDR:-:9091}; exec worker ;;
  directory:server) exec server ;;
  *) echo "unknown role $role for $SGN_SERVICE" >&2; exit 1 ;;
esac
