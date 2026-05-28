#!/usr/bin/env bash
# Merges the current release HEAD directly into main after a public release.

set -euo pipefail

SHA=$(git rev-parse HEAD)

# Extract the promoted SHA from the promotion merge commit so the back-sync message
# references the same token as the corresponding promote commit.
PROMOTE_COMMIT=$(git log origin/release --merges --grep="promote main to release" -1 --format="%H")
SHORT_SHA=$(git rev-parse "${PROMOTE_COMMIT}^2" 2>/dev/null | cut -c1-7)

git config user.email "github-actions[bot]@users.noreply.github.com"
git config user.name "github-actions[bot]"

git fetch origin main
git checkout main
git merge --no-ff "$SHA" -m "ci: sync versioning changes from release (${SHORT_SHA})"
git push origin main
