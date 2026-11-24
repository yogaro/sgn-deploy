#!/usr/bin/env bash
# First start of the whole stack on a server: writes .env with random secrets, creates the IAM signing key,
# builds the images, creates the three service clients (IAM->Directory, HR->IAM, LMS->IAM) and starts everything.
# Safe to repeat: existing secrets and clients in .env are kept. Run from the repo root after docker/clone-repos.sh.
# Usage: PORTAL_DOMAIN=portal.example.co.id LMS_DOMAIN=sugarledge.example.co.id DIRECTORY_DOMAIN=directory.example.co.id \
#          docker/vps-bootstrap.sh          (or set the three in .env first)
# PROXY=runcloud: RunCloud's nginx serves 80/443 and TLS; Caddy stays off (compose.runcloud.yaml). Remembered in .env.
set -euo pipefail
cd "$(dirname "$0")/.."

rand() { openssl rand -hex "${1:-24}"; }
get_env() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- || true; }
set_env() {
  local key=$1 value=$2 tmp
  tmp=$(mktemp)
  if grep -qE "^$key=" .env; then
    awk -v k="$key" -v v="$value" 'BEGIN { FS = OFS = "=" } $1 == k { print k "=" v; next } { print }' .env > "$tmp"
  else
    cp .env "$tmp" && printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi
  cat "$tmp" > .env && rm -f "$tmp"
}
need() { [[ -n "$(get_env "$1")" ]]; }

[[ -f .env ]] || { cp .env.example .env; chmod 600 .env; echo "Created .env from .env.example"; }

for key in PORTAL_DOMAIN LMS_DOMAIN DIRECTORY_DOMAIN; do
  if [[ -n "${!key:-}" ]]; then set_env "$key" "${!key}"; fi
  need "$key" || { echo "Set $key, as an environment variable or in .env (see the usage line in $0)." >&2; exit 1; }
done
PORTAL_DOMAIN=$(get_env PORTAL_DOMAIN) LMS_DOMAIN=$(get_env LMS_DOMAIN) DIRECTORY_DOMAIN=$(get_env DIRECTORY_DOMAIN)

proxy=${PROXY:-}
if [[ -z "$proxy" ]]; then [[ "$(get_env COMPOSE_FILE)" == *runcloud* ]] && proxy=runcloud || proxy=caddy; fi
case "$proxy" in
  caddy) compose_files=compose.yaml:compose.prod.yaml ;;
  runcloud) compose_files=compose.yaml:compose.prod.yaml:compose.runcloud.yaml ;;
  *) echo "PROXY must be caddy or runcloud, got $proxy." >&2; exit 1 ;;
esac
set_env COMPOSE_FILE "$compose_files"
set_env COOKIE_SECURE true
set_env LMS_PUBLIC_URL "https://$LMS_DOMAIN"
need POSTGRES_PASSWORD || set_env POSTGRES_PASSWORD "$(rand 24)"
need S3_ACCESS_KEY || set_env S3_ACCESS_KEY "$(rand 12)"
need S3_SECRET_KEY || set_env S3_SECRET_KEY "$(rand 24)"
need GRAFANA_ADMIN_PASSWORD || set_env GRAFANA_ADMIN_PASSWORD "$(rand 16)"
export COMPOSE_FILE=$compose_files

echo "Building images (first time takes a while)..."
docker compose build

key_file=$(get_env IAM_SIGNING_KEY_FILE); key_file=${key_file:-./docker/secrets/iam-signing-key.txt}
if [[ ! -s "$key_file" ]]; then
  docker run --rm sgn-iam-service genkey > "$key_file"
  chmod 600 "$key_file"
  echo "Created the IAM signing key in $key_file"
fi

docker compose up -d --wait iam directory

# createserviceclient asks its questions on stdin and prints the secret once; read it from the output.
if ! need DIRECTORY_SERVICE_KEY; then
  out=$(printf 'sgn-iam-service\n' | docker compose run --rm -T directory createserviceclient)
  set_env DIRECTORY_SERVICE_KEY "$(printf '%s\n' "$out" | awk '/^Key/ { getline; print; exit }')"
  echo "Created the Directory key for IAM"
fi
iam_client() {
  local prefix=$1 name=$2 out
  need "${prefix}_IAM_CLIENT_ID" && return
  out=$(printf '%s\niam.employees.read,iam.org.read\n' "$name" | docker compose run --rm -T iam createserviceclient)
  set_env "${prefix}_IAM_CLIENT_ID" "$(printf '%s\n' "$out" | awk -F': ' '/^Client ID:/ { print $2; exit }')"
  set_env "${prefix}_IAM_CLIENT_SECRET" "$(printf '%s\n' "$out" | awk '/^Client secret/ { getline; print; exit }')"
  echo "Created the IAM client $name"
}
iam_client HR sgn-hr-service
iam_client LMS sgn-lms-service
for key in DIRECTORY_SERVICE_KEY HR_IAM_CLIENT_ID HR_IAM_CLIENT_SECRET LMS_IAM_CLIENT_ID LMS_IAM_CLIENT_SECRET; do
  need "$key" || { echo "$key is still empty: check the createserviceclient output above." >&2; exit 1; }
done

docker compose up -d --wait --remove-orphans
docker compose ps --format 'table {{.Service}}\t{{.Status}}'

cat <<EOF

Stack is up:
  Portal       https://$PORTAL_DOMAIN/
  SUGARLedge   https://$LMS_DOMAIN/lms/
  Directory    https://$DIRECTORY_DOMAIN/

Next (see docker/DEPLOY-VPS.md):
  docker compose run --rm iam createadmin          # IAM superadmin (Portal and LMS)
  docker compose run --rm directory createuser     # Directory FE login
  SEED_PASSWORD='...' SEED_MUST_CHANGE=1 seed/run.sh --formasi && docker compose restart hr-worker
EOF
if [[ "$proxy" == runcloud ]]; then
  cat <<EOF

RunCloud: point one web app per domain at these loopback ports (docker/DEPLOY-VPS.md, "RunCloud"):
  $PORTAL_DOMAIN     -> 127.0.0.1:$(get_env PORTAL_PORT | grep . || echo 3000)
  $LMS_DOMAIN        -> 127.0.0.1:$(get_env LMS_WEB_PORT | grep . || echo 3003)
  $DIRECTORY_DOMAIN  -> 127.0.0.1:$(get_env DIRECTORY_FE_PORT | grep . || echo 3001), /api/ -> 127.0.0.1:$(get_env DIRECTORY_PORT | grep . || echo 8080)
EOF
fi
