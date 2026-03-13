#!/usr/bin/env bash
# Creates a promotion PR from a commit on main to the release branch.
#
# Usage: promote.sh [commit_sha]
#   commit_sha  Optional commit SHA to promote (defaults to latest on origin/main)

set -euo pipefail

SHA="${1:-}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"

if [ -z "$SHA" ]; then
  SHA=$(git rev-parse origin/main)
fi

SHORT_SHA=$(echo "$SHA" | cut -c1-7)
DATE=$(date +%Y%m%d)
BRANCH="promote/main-to-release-${DATE}-${SHORT_SHA}"

# Create a branch from the specified commit
git checkout -b "$BRANCH" "$SHA"
git push origin "$BRANCH"

# Check if a promotion PR already exists for this branch
EXISTING=$(gh pr list --base release --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
if [ -n "$EXISTING" ]; then
  echo "Promotion PR #$EXISTING already exists for branch $BRANCH."
  exit 0
fi

gh pr create \
  --base release \
  --head "$BRANCH" \
  --title "chore: promote main to release (${DATE})" \
  --body "$(cat <<EOF
## Summary

Promotes changes from \`main\` to \`release\` for public publishing.

- **Source commit**: [\`${SHORT_SHA}\`](https://github.com/${REPO}/commit/${SHA})
- **Changesets included**: $(ls .changeset/*.md 2>/dev/null | grep -v README.md | wc -l | tr -d ' ') pending changeset(s)

### What happens next

1. Merge this PR into \`release\`
2. The release workflow creates a **Version PR** with proper version bumps and changelogs
3. Merge the Version PR to publish to NPM
4. A back-sync PR from \`release\` → \`main\` is auto-created
EOF
)"
