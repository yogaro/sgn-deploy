#!/usr/bin/env bash
# Clones every app repo into the folder name compose.yaml, go.mod and package.json expect, or pulls it when already there.
# Needs read access to the repos (SSH key on the GitHub account, or GIT_BASE=https://github.com/<owner> with a credential helper).
# Usage: docker/clone-repos.sh            GIT_BASE=git@github.com:yogaro BRANCH=main by default
set -euo pipefail
cd "$(dirname "$0")/.."
BASE=${GIT_BASE:-git@github.com:yogaro}
BRANCH=${BRANCH:-main}

# repo name -> folder name
repos=(
  sgn-iam-be:sgn-iam-service
  sgn-iam-contracts:sgn-iam-contracts
  sgn-hr-be:sgn-hr-service
  sgn-hr-contracts:sgn-hr-contracts
  sgn-lms-be:sgn-lms-service
  sgn-lms-fe:sgn-lms-fe
  sgn-lms-contracts:sgn-lms-contracts
  sgn-directory-be:sgn-directory-service
  sgn-directory-fe:sgn-directory-fe
  sgn-directory-contracts:sgn-directory-contracts
  sgn-portal-fe:sgn-portal
)

for pair in "${repos[@]}"; do
  repo=${pair%%:*} dir=${pair##*:}
  if [[ -d "$dir/.git" ]]; then
    echo "pull  $dir"
    git -C "$dir" pull --ff-only -q
  else
    echo "clone $repo -> $dir"
    git clone -q --branch "$BRANCH" "$BASE/$repo.git" "$dir"
  fi
done
echo "All repos are in place."
