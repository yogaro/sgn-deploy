#!/usr/bin/env bash
# Loads the demo end to end into the local Docker stack, in the order the data flows:
#   Directory -> IAM sync -> IAM roles and password -> LMS sync -> LMS demo data.
# Safe to repeat: every step is keyed by codes or rebuilds its own tables. Needs: docker compose up, node 20+.
# Usage: [SEED_PASSWORD=...] [SEED_MUST_CHANGE=1] seed/run.sh [--formasi] [--assets]
#   --formasi  builds the organisation from the real staff list (seed/data/private/formasi.json, see formasi-import.mjs) and
#              loads the LMS clean, with no made-up history; without it the made-up demo organisation and history load.
#   --assets   regenerates and uploads the media first; it is skipped when media.json exists.
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
FORMASI=""; ASSETS=""
for a in "$@"; do [[ "$a" == "--formasi" ]] && FORMASI=1; [[ "$a" == "--assets" ]] && ASSETS=1; done
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

if [[ -n "$ASSETS" || ! -f seed/assets/media.json ]]; then
  node seed/gen/assets.mjs
fi

echo "1/7 Directory"
if [[ -n "$FORMASI" ]]; then node seed/gen/directory-formasi.mjs; else node seed/gen/directory.mjs; fi
psql -d db_directory < seed/sql/10_directory.sql
echo "2/7 IAM sync"
if [[ -n "${SEED_IAM_CONTAINER:-}" ]]; then docker exec "$SEED_IAM_CONTAINER" sgn-start run sync --full
else docker compose run --rm iam sync --full; fi
echo "3/7 IAM roles and demo password"
if [[ -n "$FORMASI" ]]; then node seed/gen/iam-formasi.mjs; else node seed/gen/iam.mjs; fi
psql -d db_iam < seed/sql/20_iam_roles.sql
echo "4/7 LMS sync"
LOGIN_BODY=$(python3 -c 'import json,os;print(json.dumps({"login_id":os.environ["SEED_ADMIN_LOGIN"],"password":os.environ["DEMO_PASSWORD"]}))')
until TOKEN=$(curl -sf -X POST "$LMS_BASE/api/iam/v1/auth/login" -H 'content-type: application/json' \
    -d "$LOGIN_BODY" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])'); do sleep 5; done
curl -sf -X POST "$LMS_BASE/api/lms/v1/admin/sync/iam" -H "authorization: Bearer $TOKEN"; echo
echo "5/7 Media"
[[ -f seed/assets/media.json ]] && node seed/gen/upload.mjs
echo "6/7 LMS demo data"
node seed/gen/lms.mjs ${FORMASI:+--formasi}
psql -d db_lms < seed/sql/01_reset_lms_domain.sql
psql -d db_lms < seed/sql/30_lms.sql
echo "7/7 Banner Beranda"
node seed/gen/banners.mjs
echo "Done. Log in at $LMS_BASE/lms/ - accounts are listed in seed/README.md"
