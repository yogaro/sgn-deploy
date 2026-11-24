#!/usr/bin/env bash
# Backs up the four databases (pg_dump custom format) and the object store (course media, HR attachments) into
# backups/<date>/, and removes backups older than KEEP_DAYS (default 14). BACKUP_REMOTE (rsync target, e.g.
# backup@10.0.0.5:/srv/sgn) also copies the new backup off the host.
# Usage: docker/backup.sh          cron: 0 2 * * * cd /opt/sgn && BACKUP_REMOTE=... docker/backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
dir=backups/$(date +%F-%H%M)
mkdir -p "$dir"
chmod 700 backups

for db in db_iam db_hr db_lms db_directory; do
  docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-sgn}" -Fc "$db" > "$dir/$db.dump"
done
docker run --rm -v "${COMPOSE_PROJECT_NAME:-sgn}_s3-data":/data:ro -v "$PWD/$dir":/out alpine tar czf /out/s3-data.tar.gz -C /data .
cp .env "$dir/env" && cp docker/secrets/iam-signing-key.txt "$dir/" && chmod 600 "$dir"/*

if [[ -n "${BACKUP_REMOTE:-}" ]]; then
  rsync -a -e "ssh -o BatchMode=yes" "$dir" "$BACKUP_REMOTE/"
fi
find backups -mindepth 1 -maxdepth 1 -type d -mtime +"${KEEP_DAYS:-14}" -exec rm -rf {} +
echo "$(date '+%F %T') backup ok: $dir ($(du -sh "$dir" | cut -f1))"
