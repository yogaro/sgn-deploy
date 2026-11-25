#!/usr/bin/env bash
# One command from this machine: copies the seed (scripts, the real staff list, media) to a RunCloud server over SSH and
# runs seed/run.sh --formasi there against the running stack containers. No git or token on the server.
# Needs here: ssh access, seed/data/private/ and seed/assets/ (sgn-seed-data.tar.gz). Needs there: docker, node 20+,
# python3, curl. The staff list and media (~290 MB) are sent once and kept on the server until a run succeeds, so a
# retry only sends the scripts; after a successful run the copy is removed.
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
HAVE_DATA=$("${SSH[@]}" "$DEST" 'set -e
  for t in docker python3 curl; do command -v $t >/dev/null || { echo "missing on server: $t" >&2; exit 1; }; done
  docker ps --format "{{.Names}}" | grep -q sgn-postgres || { echo "no sgn-postgres container (or no docker access)" >&2; exit 1; }
  [ -f ~/sgn-seed/.data-copied ] && echo yes || echo no')

if [[ "$HAVE_DATA" == yes ]]; then
  echo "Staff list and media already on the server from the last try: not sending them again."
else
  echo "Copying the staff list and media to the server (about 290 MB, no progress shown)..."
  COPYFILE_DISABLE=1 tar -czf - --exclude '.DS_Store' seed/assets seed/data "Trailer Sugartime.mp4" |
    "${SSH[@]}" "$DEST" 'rm -rf ~/sgn-seed && mkdir -p ~/sgn-seed && tar -xzf - -C ~/sgn-seed && touch ~/sgn-seed/.data-copied'
fi

# The scripts (small) travel with the run, so a retry always uses the version on this machine.
echo "Running the seed on the server..."
COPYFILE_DISABLE=1 tar -czf - --exclude '.DS_Store' --exclude 'seed/assets' --exclude 'seed/data' --exclude 'seed/backup' \
  --exclude 'seed/sql/[123]0_*' seed | "${SSH[@]}" "$DEST" "cd ~/sgn-seed && tar -xzf - && \
  find seed -name '*.sh' -exec sed -i 's/\r\$//' {} + && \
  $(cat <<'NODE'
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "node 20+ not on the server: using node:22-alpine in docker"
  mkdir -p bin
  printf '%s\n' '#!/bin/sh' \
    'exec docker run --rm -i -u "$(id -u):$(id -g)" -v "$HOME/sgn-seed:$HOME/sgn-seed" -w "$PWD" \' \
    '  -e LMS_BASE -e DEMO_PASSWORD -e SEED_ADMIN_LOGIN -e SEED_ADMIN_EMAIL -e SEED_PASSWORD_HASH -e SEED_MUST_CHANGE \' \
    '  node:22-alpine node "$@"' > bin/node
  chmod +x bin/node
  export PATH="$PWD/bin:$PATH"
fi
NODE
) && \
  export SEED_PG_CONTAINER=\$(docker ps --format '{{.Names}}' | grep sgn-postgres | head -1) \
         SEED_IAM_CONTAINER=\$(docker ps --format '{{.Names}}' | grep sgn-stack-iam | head -1) \
         LMS_BASE=$(printf %q "$LMS_BASE") SEED_PASSWORD=$(printf %q "$SEED_PASSWORD") SEED_MUST_CHANGE=$(printf %q "$MUST") && \
  echo \"containers: \$SEED_PG_CONTAINER / \$SEED_IAM_CONTAINER\" && \
  bash seed/run.sh --formasi </dev/null && cd ~ && rm -rf ~/sgn-seed" || {
  echo; echo "Seed stopped (see the error above). Run the same command again once fixed: the 290 MB stays on the server." >&2
  exit 1
}

echo
echo "Done. In RunCloud, restart the hr-worker container so HR picks up the staff now."
