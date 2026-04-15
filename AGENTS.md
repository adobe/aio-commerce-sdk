# Claude Code — Repo Conventions

## Commits

- Keep commit messages terse (e.g. `fix auth token refresh`)

## Branches

- Prefix with the Jira ticket (e.g. `CEXT-1234/short-description`)

## Git push

- Always run `pnpm test` and `pnpm typecheck` before pushing (`pnpm check:ci` already runs on commit via lint-staged)
- Always ask before pushing code

## Pull requests

- Always ask before creating a PR
- Prefix the PR title with the Jira ticket (e.g. `CEXT-1234: short description`)
- Always follow `.github/PULL_REQUEST_TEMPLATE.md` when writing PR descriptions

## Changesets

- Every code change that requires a release must include a changeset (test-only changes do not need one)
- Create one with `pnpm changeset add --empty`, then edit the generated `.changeset/<name>.md` file
- Changeset messages must be user-facing and concise — avoid implementation details
- Derive the bump type from semver rules:
  - `patch` — bug fixes, no API surface change
  - `minor` — additive non-breaking changes (new exports, new optional fields, enriched responses)
  - `major` — breaking changes (removed exports, required fields added to input/write types, renamed types)
- If the bump type is ambiguous, ask before proceeding
