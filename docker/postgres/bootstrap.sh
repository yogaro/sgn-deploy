#!/bin/sh
# Creates the accounts and service credentials a fresh stack needs, from environment variables, so a stack deploy needs
# no createadmin/createserviceclient. Idempotent: runs on every deploy after iam-migrate (compose.stack.yaml), or in the
# iam stack image before the server.
#   Always: IAM superadmin ADMIN_LOGIN/ADMIN_PASSWORD and the LMS client (LMS_IAM_CLIENT_SECRET).
#   Only when set (the LMS-only stack leaves them out): the HR client (HR_IAM_CLIENT_SECRET), and the Directory key and
#   login (DIRECTORY_SERVICE_KEY, DIRECTORY_ADMIN_EMAIL, DIRECTORY_ADMIN_PASSWORD).
#   Accounts are created only when missing, so passwords changed in the apps are kept. Service secrets are (re)written.
set -eu
: "${PGHOST:?}" "${PGUSER:?}" "${PGPASSWORD:?}"
: "${ADMIN_LOGIN:?}" "${ADMIN_PASSWORD:?}" "${LMS_IAM_CLIENT_SECRET:?}"

q() { psql -v ON_ERROR_STOP=1 -qtA "$@"; }
# bcrypt hashes come from pgcrypto in the scratch "postgres" database, so the app databases get no extension.
bcrypt() { echo "SELECT crypt(:'v', gen_salt('bf', 12));" | q -d postgres -v v="$1"; }
client() {
  q -d db_iam -v id="$1" -v hash="$(bcrypt "$2")" <<'SQL'
INSERT INTO iam.service_clients (client_id, secret_hash, scopes)
VALUES (:'id', :'hash', ARRAY['iam.employees.read', 'iam.org.read'])
ON CONFLICT (client_id) DO UPDATE SET secret_hash = EXCLUDED.secret_hash, scopes = EXCLUDED.scopes, is_active = true;
SQL
}

until q -d db_iam -c "SELECT 1 FROM iam.roles WHERE code = 'SUPERADMIN'" 2>/dev/null | grep -q 1; do
  echo "waiting for the IAM schema..."; sleep 3
done
q -d postgres -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto' >/dev/null

q -d db_iam -v login="$ADMIN_LOGIN" -v hash="$(bcrypt "$ADMIN_PASSWORD")" <<'SQL'
BEGIN;
INSERT INTO iam.users (login_id, password_hash, status, must_change_password, password_changed_at)
SELECT upper(btrim(:'login')), :'hash', 'ACTIVE', false, now()
WHERE NOT EXISTS (SELECT 1 FROM iam.users WHERE upper(login_id) = upper(btrim(:'login')));
INSERT INTO iam.user_roles (user_id, role_id)
SELECT u.id, r.id FROM iam.users u, iam.roles r
WHERE upper(u.login_id) = upper(btrim(:'login')) AND r.code = 'SUPERADMIN'
ON CONFLICT DO NOTHING;
COMMIT;
SQL
client svc-sgn-lms-service "$LMS_IAM_CLIENT_SECRET"
done_list="IAM superadmin $(echo "$ADMIN_LOGIN" | tr a-z A-Z), svc-sgn-lms-service"

if [ -n "${HR_IAM_CLIENT_SECRET:-}" ]; then
  client svc-sgn-hr-service "$HR_IAM_CLIENT_SECRET"
  done_list="$done_list, svc-sgn-hr-service"
fi

if [ -n "${DIRECTORY_SERVICE_KEY:-}" ]; then
  : "${DIRECTORY_ADMIN_EMAIL:?set with DIRECTORY_SERVICE_KEY}" "${DIRECTORY_ADMIN_PASSWORD:?set with DIRECTORY_SERVICE_KEY}"
  # A fresh volume reports healthy while the Directory schema is still being built, so wait for it over TCP.
  until q -d db_directory -c "SELECT 1 WHERE to_regclass('public.service_clients') IS NOT NULL" 2>/dev/null | grep -q 1; do
    echo "waiting for the Directory schema..."; sleep 3
  done
  q -d db_directory -v key="$DIRECTORY_SERVICE_KEY" -v email="$DIRECTORY_ADMIN_EMAIL" \
    -v hash="$(bcrypt "$DIRECTORY_ADMIN_PASSWORD")" <<'SQL'
BEGIN;
UPDATE service_clients SET is_active = false
WHERE name = 'sgn-iam-service' AND key_hash <> encode(sha256(convert_to(:'key', 'UTF8')), 'hex');
INSERT INTO service_clients (name, key_hash)
VALUES ('sgn-iam-service', encode(sha256(convert_to(:'key', 'UTF8')), 'hex'))
ON CONFLICT (key_hash) DO UPDATE SET is_active = true;
INSERT INTO users (employee_number, email, password_hash, full_name)
SELECT 'ADMIN-DIRECTORY', lower(btrim(:'email')), :'hash', 'Admin Directory'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(btrim(:'email')) OR employee_number = 'ADMIN-DIRECTORY');
COMMIT;
SQL
  done_list="$done_list, Directory key and login $DIRECTORY_ADMIN_EMAIL"
fi

echo "bootstrap ok: $done_list"
