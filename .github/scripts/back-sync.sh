#!/usr/bin/env bash
# Merges the current release HEAD directly into main after a public release.

set -euo pipefail

SHA=$(git rev-parse HEAD)

# Fetch main first so --not origin/main filters correctly below.
git fetch origin main

# Look for a promotion merge commit among commits not yet in main. Falls back to the
# release HEAD SHA for hotfixes, which have no promotion merge commit in the new commits
# (either because none exists, or because a prior one is already in main).
PROMOTE_COMMIT=$(git log origin/release --not origin/main --merges \
  --grep="promote main to release" -1 --format="%H")
if [ -n "$PROMOTE_COMMIT" ]; then
  SHORT_SHA=$(git rev-parse "${PROMOTE_COMMIT}^2" 2>/dev/null | cut -c1-7)
else
  SHORT_SHA=$(git rev-parse HEAD | cut -c1-7)
fi

git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"

git checkout main
git merge --no-ff "$SHA" -m "ci: sync versioning changes from release (${SHORT_SHA})"
git push origin main
