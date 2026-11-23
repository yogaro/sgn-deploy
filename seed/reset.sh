#!/usr/bin/env bash
# Empties the LMS demo data (courses, learners, evaluation, LNA, Knowledge Hub); people and accounts stay. Run seed/run.sh to load again.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose exec -T postgres psql -U sgn -d db_lms -v ON_ERROR_STOP=1 -q < seed/sql/01_reset_lms_domain.sql
echo "LMS demo data removed."
