#!/usr/bin/env bash
# One command from this machine: copies the seed (scripts, the real staff list, media) to a RunCloud server over SSH and
# runs seed/run.sh --formasi there against the running stack containers. No git or token on the server.
# Needs here: ssh access, seed/data/private/ and seed/assets/ (sgn-seed-data.tar.gz). Needs there: docker, node 20+,
# python3, curl. The copy is removed from the server afterwards.
# Usage: SEED_PASSWORD='…' [SEED_MUST_CHANGE=0] [SSH_PORT=22] seed/ssh-seed.sh user@server https://lms.example.co.id
set -euo pipefail
cd "$(dirname "$0")/.."
DEST=${1:?usage: SEED_PASSWORD=… seed/ssh-seed.sh user@server https://lms-domain}
LMS_BASE=${2:?give the LMS address, e.g. https://sugarledge.example.co.id}
: "${SEED_PASSWORD:?set SEED_PASSWORD (first password of every seeded account)}"
MUST=${SEED_MUST_CHANGE:-1}
SSH=(ssh -p "${SSH_PORT:-22}" -o ServerAliveInterval=30)
for f in seed/data/private/formasi.json seed/assets/media.json "Trailer Sugartime.mp4"; do
  [[ -f "$f" ]] || { echo "missing $f: extract sgn-seed-data.tar.gz into this folder first" >&2; exit 1; }
done

echo "Checking the server..."
"${SSH[@]}" "$DEST" 'set -e
  for t in docker node python3 curl; do command -v $t >/dev/null || { echo "missing on server: $t" >&2; exit 1; }; done
  [ "$(node -p "process.versions.node.split(\".\")[0]")" -ge 20 ] || { echo "node 20+ needed on server" >&2; exit 1; }
  docker ps --format "{{.Names}}" | grep -q sgn-postgres || { echo "no sgn-postgres container (or no docker access)" >&2; exit 1; }'

echo "Copying the seed to the server (about 290 MB)..."
COPYFILE_DISABLE=1 tar -czf - --exclude '.DS_Store' --exclude 'seed/backup' --exclude 'seed/sql/[123]0_*' \
  seed "Trailer Sugartime.mp4" | "${SSH[@]}" "$DEST" 'rm -rf ~/sgn-seed && mkdir -p ~/sgn-seed && tar -xzf - -C ~/sgn-seed'

echo "Running the seed on the server..."
"${SSH[@]}" "$DEST" "cd ~/sgn-seed && \
  export SEED_PG_CONTAINER=\$(docker ps --format '{{.Names}}' | grep sgn-postgres | head -1) \
         SEED_IAM_CONTAINER=\$(docker ps --format '{{.Names}}' | grep sgn-stack-iam | head -1) \
         LMS_BASE=$(printf %q "$LMS_BASE") SEED_PASSWORD=$(printf %q "$SEED_PASSWORD") SEED_MUST_CHANGE=$(printf %q "$MUST") && \
  echo \"containers: \$SEED_PG_CONTAINER / \$SEED_IAM_CONTAINER\" && \
  bash seed/run.sh --formasi; status=\$?; cd ~ && rm -rf ~/sgn-seed; exit \$status"

echo
echo "Done. In RunCloud, restart the hr-worker container so HR picks up the staff now."
