#!/usr/bin/env bash
# Creates a back-sync PR from release to main after a public release.
# Skips if a back-sync PR already exists.

set -euo pipefail

EXISTING=$(gh pr list --base main --head release --json number --jq '.[0].number' 2>/dev/null || echo "")
if [ -n "$EXISTING" ]; then
  echo "Back-sync PR #$EXISTING already exists. Skipping."
  exit 0
fi

gh pr create \
  --base main \
  --head release \
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
