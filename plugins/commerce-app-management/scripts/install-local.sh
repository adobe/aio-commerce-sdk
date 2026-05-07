#!/usr/bin/env bash
# Installs Commerce App Management skills into a project directory.
# Delegates to `npx skills add` for cross-agent compatibility (Claude Code, Cursor, VS Code, etc.)
# Agent format is auto-detected from <dest-dir> (e.g. .claude/ → Claude Code, .cursor/ → Cursor).
# If no agent config is found, the CLI prompts interactively.
# Any extra arguments are forwarded to `npx skills add`.
#
# Usage: install-local.sh <dest-dir> [options]
#   --yes, -y          Install all skills without prompts
#   --skill <name>     Install a specific skill only
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: install-local.sh <dest-dir> [--yes] [--skill <name>]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="$(realpath "$SCRIPT_DIR/..")"

if [[ ! -d "$1" ]]; then
  mkdir -p "$1"
  echo "created: $1"
fi

DEST="$(realpath "$1")"
shift

cd "$DEST"
npx skills add "$SOURCE" "$@"
