#!/usr/bin/env bash
# Loads the FORMASI staff and the pilot modules into a server with no SSH (RunCloud Docker Stacks), from this machine.
# Everything that has an HTTP API (IAM sync, LMS sync, media, banners) runs here against the public LMS domain; the
# SQL files are written to seed/sql/ and imported by hand through Adminer, the script pausing at each one.
# Needs: node 20+, curl, python3, htpasswd (macOS has it), seed/data/private/*.json and seed/assets/ (sgn-seed-data.tar.gz).
# Usage: LMS_BASE=https://sugarledge.example.co.id SEED_PASSWORD='…' ADMIN_LOGIN=SUPERADMIN ADMIN_PASSWORD='…' seed/remote.sh
set -euo pipefail
cd "$(dirname "$0")/.."
: "${LMS_BASE:?set LMS_BASE, e.g. https://sugarledge.example.co.id}"
: "${SEED_PASSWORD:?set SEED_PASSWORD (first password of every seeded account)}"
: "${ADMIN_LOGIN:?set ADMIN_LOGIN (the IAM superadmin of the stack)}" "${ADMIN_PASSWORD:?set ADMIN_PASSWORD}"
LMS_BASE=${LMS_BASE%/}
export LMS_BASE DEMO_PASSWORD=$SEED_PASSWORD SEED_ADMIN_LOGIN=ADMIN-LMS SEED_MUST_CHANGE=1
for f in seed/data/private/formasi.json seed/data/private/positions.json seed/assets/media.json; do
  [[ -f "$f" ]] || { echo "missing $f: extract sgn-seed-data.tar.gz into this folder first" >&2; exit 1; }
done

token() {
  python3 -c 'import json,sys;print(json.dumps({"login_id":sys.argv[1],"password":sys.argv[2]}))' "$1" "$2" |
    curl -sf -X POST "$LMS_BASE/api/iam/v1/auth/login" -H 'content-type: application/json' -d @- |
    python3 -c 'import json,sys;print(json.load(sys.stdin)["access_token"])'
}
import_sql() {
  echo
  echo ">>> Adminer: database $1 -> Import -> choose $2 -> Execute."
  read -r -p ">>> Press Enter once Adminer shows the import finished without errors... "
}

echo "1/6 Directory: staff, units, positions"
node seed/gen/directory-formasi.mjs
import_sql db_directory "$PWD/seed/sql/10_directory.sql"

echo "2/6 IAM full sync from Directory"
TOKEN=$(token "$ADMIN_LOGIN" "$ADMIN_PASSWORD") || { echo "superadmin login failed: check ADMIN_LOGIN/ADMIN_PASSWORD" >&2; exit 1; }
curl -sf -X POST "$LMS_BASE/api/iam/v1/sync/directory?full=true" -H "authorization: Bearer $TOKEN"; echo

echo "3/6 IAM roles, first password, Admin L&D account"
# bcrypt via htpasswd ($2y$, accepted by IAM): the password never leaves this machine except as its hash.
export SEED_PASSWORD_HASH=$(htpasswd -bnBC 12 "" "$SEED_PASSWORD" | tr -d ':\n')
node seed/gen/iam-formasi.mjs >/dev/null
import_sql db_iam "$PWD/seed/sql/20_iam_roles.sql"

echo "4/6 LMS sync from IAM"
TOKEN=$(token ADMIN-LMS "$SEED_PASSWORD") || { echo "ADMIN-LMS login failed: was 20_iam_roles.sql imported?" >&2; exit 1; }
curl -sf -X POST "$LMS_BASE/api/lms/v1/admin/sync/iam" -H "authorization: Bearer $TOKEN"; echo

echo "5/6 Media upload (about 275 MB) and LMS data"
node seed/gen/upload.mjs
node seed/gen/lms.mjs --formasi
import_sql db_lms "$PWD/seed/sql/01_reset_lms_domain.sql"
import_sql db_lms "$PWD/seed/sql/30_lms.sql"

echo "6/6 Login banners"
node seed/gen/banners.mjs

echo
echo "Done. Restart the hr-worker container in RunCloud so HR picks up the staff now."
echo "Admin L&D: ADMIN-LMS; employees: their NIK. Both use SEED_PASSWORD; employees must change it at first sign-in."
