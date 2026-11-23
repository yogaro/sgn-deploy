#!/usr/bin/env bash
# Loads the demo end to end into the local Docker stack, in the order the data flows:
#   Directory -> IAM sync -> IAM roles and password -> LMS sync -> LMS demo data.
# Safe to repeat: every step is keyed by codes or rebuilds its own tables. Needs: docker compose up, node 20+.
# Usage: seed/run.sh [--formasi] [--assets]
#   --formasi  builds the organisation from the real staff list (seed/data/private/formasi.json, see formasi-import.mjs) and
#              loads the LMS clean, with no made-up history; without it the made-up demo organisation and history load.
#   --assets   regenerates and uploads the media first; it is skipped when media.json exists.
set -euo pipefail
cd "$(dirname "$0")/.."
psql() { docker compose exec -T postgres psql -U sgn -v ON_ERROR_STOP=1 -q "$@"; }
FORMASI=""; ASSETS=""
for a in "$@"; do [[ "$a" == "--formasi" ]] && FORMASI=1; [[ "$a" == "--assets" ]] && ASSETS=1; done
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
docker compose run --rm iam sync --full
echo "3/7 IAM roles and demo password"
if [[ -n "$FORMASI" ]]; then node seed/gen/iam-formasi.mjs; else node seed/gen/iam.mjs; fi
psql -d db_iam < seed/sql/20_iam_roles.sql
echo "4/7 LMS sync"
until TOKEN=$(curl -sf -X POST http://127.0.0.1:3003/api/iam/v1/auth/login -H 'content-type: application/json' \
    -d "{\"login_id\":\"${SEED_ADMIN_LOGIN:-ADMIN-LMS}\",\"password\":\"Demo#Sgn2026\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])'); do sleep 5; done
curl -sf -X POST http://127.0.0.1:3003/api/lms/v1/admin/sync/iam -H "authorization: Bearer $TOKEN"; echo
echo "5/7 Media"
[[ -f seed/assets/media.json ]] && node seed/gen/upload.mjs
echo "6/7 LMS demo data"
node seed/gen/lms.mjs ${FORMASI:+--formasi}
psql -d db_lms < seed/sql/01_reset_lms_domain.sql
psql -d db_lms < seed/sql/30_lms.sql
echo "7/7 Banner Beranda"
node seed/gen/banners.mjs
echo "Done. Log in at http://127.0.0.1:3003/lms/ - accounts are listed in seed/README.md"
