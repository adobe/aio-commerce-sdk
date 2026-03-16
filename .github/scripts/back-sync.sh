#!/usr/bin/env bash
# Creates a back-sync PR from release to main after a public release.
# Skips if a back-sync PR already exists.

set -euo pipefail

SHA=$(git rev-parse HEAD)
SHORT_SHA=$(echo "$SHA" | cut -c1-7)
DATE=$(date +%Y%m%d)
BRANCH="back-sync/release-to-main-${DATE}-${SHORT_SHA}"

# Create a branch from current HEAD (release)
git checkout -b "$BRANCH"
git push origin "$BRANCH"

EXISTING=$(gh pr list --base main --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
if [ -n "$EXISTING" ]; then
  echo "Back-sync PR #$EXISTING already exists for branch $BRANCH. Skipping."
  exit 0
fi

gh pr create \
  --base main \
  --head "$BRANCH" \
  --title "ci: sync versioning changes from release" \
  --body "$(cat <<'EOF'
## Summary

Automated PR to sync version bumps and changelog updates from `release` back to `main`.

This PR brings:
- Updated package versions
- Updated CHANGELOG.md files
- Consumed changeset files

> Created automatically after a public release.
EOF
)"
