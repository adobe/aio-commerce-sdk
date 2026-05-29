#!/usr/bin/env bash
# Promotes a commit from main to the release branch via a direct merge commit.
#
# Usage: promote.sh [commit_sha]
#   commit_sha  Optional commit SHA to promote (defaults to latest on origin/main)

set -euo pipefail

SHA="${1:-}"

if [ -z "$SHA" ]; then
  SHA=$(git rev-parse origin/main)
fi

SHORT_SHA=$(echo "$SHA" | cut -c1-7)

git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"

git checkout release
# --no-ff is required: back-sync.sh finds this merge commit via `git log --merges`
# to recover SHORT_SHA for its own commit message. A fast-forward would leave no
# merge commit to grep for, breaking SHA correlation.
git merge --no-ff "$SHA" -m "ci: promote main to release (${SHORT_SHA})"
git push origin release
