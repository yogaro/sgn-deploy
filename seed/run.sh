#!/usr/bin/env bash
# Loads the demo end to end into the local Docker stack, in the order the data flows:
#   Directory -> IAM sync -> IAM roles and password -> LMS sync -> LMS demo data.
# Safe to repeat: every step is keyed by codes or rebuilds its own tables. Needs: docker compose up, node 20+.
# Usage: [SEED_PASSWORD=...] [SEED_MUST_CHANGE=1] seed/run.sh [--formasi] [--assets]
#   --formasi  builds the organisation from the real staff list (seed/data/private/formasi.json, see formasi-import.mjs) and
#              loads the LMS clean, with no made-up history; without it the made-up demo organisation and history load.
#   --assets   regenerates and uploads the media first; it is skipped when media.json exists.
#   --org      only the organisation: Directory, IAM sync, LMS sync (steps 1, 2, 4). Passwords, roles, courses and
#              learning progress are left as they are, so it is safe on a server already in use.
#   SEED_PASSWORD     password of every seeded account (default: the local demo password); required with SEED_MUST_CHANGE.
#   SEED_MUST_CHANGE  1 (with --formasi) makes employees change it at first login; the Admin L&D account keeps it, since the
#                     seed signs in as it.
set -euo pipefail
cd "$(dirname "$0")/.."
# Docker Stacks (RunCloud) have no compose project: SEED_PG_CONTAINER / SEED_IAM_CONTAINER name the running containers.
pg_exec() {
  # The socket, not PGHOST: a stack env shared by every container (PGHOST=<service>) would send psql over TCP with no password.
  if [[ -n "${SEED_PG_CONTAINER:-}" ]]; then docker exec -i -e PGHOST=/run/postgresql "$SEED_PG_CONTAINER" psql -U sgn "$@"
  else docker compose exec -T postgres psql -U sgn "$@"; fi
}
psql() { pg_exec -v ON_ERROR_STOP=1 -q "$@"; }
FORMASI=""; ASSETS=""; ORG=""
for a in "$@"; do [[ "$a" == "--formasi" ]] && FORMASI=1; [[ "$a" == "--assets" ]] && ASSETS=1; [[ "$a" == "--org" ]] && ORG=1; done
if [[ -n "${SEED_MUST_CHANGE:-}" && -z "${SEED_PASSWORD:-}" ]]; then
  echo "SEED_MUST_CHANGE needs SEED_PASSWORD: the demo password is public." >&2; exit 1
fi
export DEMO_PASSWORD=${SEED_PASSWORD:-Demo#Sgn2026}
export LMS_BASE=${LMS_BASE:-http://127.0.0.1:${LMS_WEB_PORT:-3003}}
# bcrypt hash of the password, made by pgcrypto inside the Postgres container (the scratch "postgres" database).
export SEED_PASSWORD_HASH=$(echo "CREATE EXTENSION IF NOT EXISTS pgcrypto; SELECT crypt(:'pw', gen_salt('bf', 12));" |
  pg_exec -d postgres -v ON_ERROR_STOP=1 -qtA -v pw="$DEMO_PASSWORD" | tail -1)
# Without the hash the account scripts would fall back to the public demo password: stop instead.
[[ "$SEED_PASSWORD_HASH" == \$2* ]] || { echo "could not make the password hash (database not reachable?)" >&2; exit 1; }
# The L&D admin the scripts sign in as: a real one with --formasi (Staf Pendidikan & Pelatihan), else the made-up Arief.
export SEED_ADMIN_EMAIL=$([[ -n "$FORMASI" ]] && echo "admin.lms@sgn.example" || echo "arief.nasution@sgn.example")
# The sign-in name of that admin (fiktif seed: set SEED_ADMIN_LOGIN to the NIK of the employee above).
export SEED_ADMIN_LOGIN=${SEED_ADMIN_LOGIN:-ADMIN-LMS}

if [[ -z "$ORG" ]] && [[ -n "$ASSETS" || ! -f seed/assets/media.json ]]; then
  node seed/gen/assets.mjs
fi

# SEED_FROM=N resumes at step N after a failure, skipping the steps that already went through.
from() { [[ $1 -ge ${SEED_FROM:-1} ]] && { [[ -z "$ORG" ]] || [[ $1 == [124] ]]; }; }

if from 1; then
  echo "1/7 Directory"
  if [[ -n "$FORMASI" ]]; then node seed/gen/directory-formasi.mjs; else node seed/gen/directory.mjs; fi
  psql -d db_directory < seed/sql/10_directory.sql
fi
if from 2; then
  echo "2/7 IAM sync"
  if [[ -n "${SEED_IAM_CONTAINER:-}" ]]; then docker exec "$SEED_IAM_CONTAINER" sgn-start run sync --full
  else docker compose run --rm iam sync --full; fi
fi
if from 3; then
  echo "3/7 IAM roles and demo password"
  if [[ -n "$FORMASI" ]]; then node seed/gen/iam-formasi.mjs; else node seed/gen/iam.mjs; fi
  psql -d db_iam < seed/sql/20_iam_roles.sql
fi
if from 4; then
  echo "4/7 LMS sync"
  LOGIN_BODY=$(python3 -c 'import json,os;print(json.dumps({"login_id":os.environ["SEED_ADMIN_LOGIN"],"password":os.environ["DEMO_PASSWORD"]}))')
  until TOKEN=$(curl -sf -X POST "$LMS_BASE/api/iam/v1/auth/login" -H 'content-type: application/json' \
      -d "$LOGIN_BODY" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])'); do sleep 5; done
  curl -sf -X POST "$LMS_BASE/api/lms/v1/admin/sync/iam" -H "authorization: Bearer $TOKEN"; echo
fi
if from 5; then
  echo "5/7 Media"
  # upload.mjs reads the media table through files written here, so it needs no database access of its own.
  media_sql="SELECT file_name FROM course.media WHERE status = 'READY' AND file_name LIKE 'demo-%'"
  pg_exec -d db_lms -v ON_ERROR_STOP=1 -At -c "$media_sql" > seed/assets/.media-have
  SEED_MEDIA_HAVE=seed/assets/.media-have node seed/gen/upload.mjs
  pg_exec -d db_lms -v ON_ERROR_STOP=1 -At -c "SELECT file_name, id, kind, coalesce(duration_s, 0) FROM course.media
    WHERE status = 'READY' AND file_name LIKE 'demo-%'" > seed/assets/.media-rows
  SEED_MEDIA_ROWS=seed/assets/.media-rows node seed/gen/upload.mjs --index
fi
if from 6; then
  echo "6/7 LMS demo data"
  node seed/gen/lms.mjs ${FORMASI:+--formasi}
  psql -d db_lms < seed/sql/01_reset_lms_domain.sql
  psql -d db_lms < seed/sql/30_lms.sql
fi
if from 7; then
  echo "7/7 Banner Beranda"
  node seed/gen/banners.mjs
fi
echo "Done. Log in at $LMS_BASE/lms/ - accounts are listed in seed/README.md"
