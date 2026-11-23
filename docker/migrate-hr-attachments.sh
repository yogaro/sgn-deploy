#!/usr/bin/env bash
# Copies HR attachments from the old sgn_hr-storage volume into the hr-files bucket. Run once after switching HR to S3.
# Safe to repeat: files already in the bucket are skipped, and the old volume is only read, never changed or removed.
# Needs: docker, S3_ACCESS_KEY and S3_SECRET_KEY in .env.
# Usage: docker/migrate-hr-attachments.sh
set -euo pipefail
cd "$(dirname "$0")/.."

VOLUME=${HR_STORAGE_VOLUME:-sgn_hr-storage}
NETWORK=${COMPOSE_NETWORK:-sgn_default}
BUCKET=${S3_BUCKET:-hr-files}

env_value() { grep -E "^$1=" .env | head -1 | cut -d= -f2-; }
ACCESS_KEY=$(env_value S3_ACCESS_KEY)
SECRET_KEY=$(env_value S3_SECRET_KEY)
[[ -n "$ACCESS_KEY" && -n "$SECRET_KEY" ]] || { echo "S3_ACCESS_KEY / S3_SECRET_KEY missing in .env" >&2; exit 1; }

docker volume inspect "$VOLUME" >/dev/null 2>&1 || { echo "Volume $VOLUME not found: nothing to copy." >&2; exit 1; }

echo "Starting the object store..."
docker compose up -d s3 >/dev/null

docker run --rm --network "$NETWORK" -v "$VOLUME":/src:ro \
  -e AWS_ACCESS_KEY_ID="$ACCESS_KEY" -e AWS_SECRET_ACCESS_KEY="$SECRET_KEY" -e AWS_DEFAULT_REGION=us-east-1 \
  -e AWS_REQUEST_CHECKSUM_CALCULATION=when_required -e AWS_RESPONSE_CHECKSUM_VALIDATION=when_required \
  -e BUCKET="$BUCKET" --entrypoint sh amazon/aws-cli -c '
    set -eu
    s3() { aws --endpoint-url http://s3:9000 "$@"; }
    for i in $(seq 1 20); do s3 s3api list-buckets >/dev/null 2>&1 && break; sleep 3; done
    s3 s3api head-bucket --bucket "$BUCKET" 2>/dev/null || s3 s3api create-bucket --bucket "$BUCKET" >/dev/null
    s3 s3 sync /src "s3://$BUCKET" --exclude "*" --include "*.jpg" --include "*.png" --include "*.pdf" --no-progress
    local_n=$(find /src -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.pdf" \) | wc -l)
    bucket_n=$(s3 s3 ls "s3://$BUCKET/" | wc -l)
    echo "Files in volume: $local_n, objects in bucket: $bucket_n"
    [ "$bucket_n" -ge "$local_n" ] || { echo "Bucket has fewer objects than the volume." >&2; exit 1; }
  '

echo "Done. The old volume $VOLUME is untouched; remove it with 'docker volume rm $VOLUME' once you have checked the attachments."
