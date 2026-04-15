# Codebase

## Project Structure

- pnpm monorepo managed with Turborepo; workspace packages in `packages/`, `packages-private/`, `configs/`, `turbo/`
- `packages/aio-commerce-sdk` — meta-package that re-exports all public libraries
- `packages/aio-commerce-lib-*` — individual public libraries (api, app, auth, config, core, events, webhooks)
- `packages-private/` — internal utilities not published to npm (common-utils, scripting-utils)
- Each package is self-contained: its own `package.json`, `tsconfig.json`, tests, and build output in `dist/`

## Commands

- `pnpm test` — run all tests (Vitest, with coverage)
- `pnpm typecheck` — TypeScript type-check across all packages
- `pnpm build` — build all packages via Turborepo
- `pnpm lint` — lint with Biome
- `pnpm check:ci` — runs automatically on commit via lint-staged
- Run scoped: `pnpm --filter @adobe/aio-commerce-lib-core test`

## Testing

- Test framework: Vitest
- Tests live in `test/unit/` and `test/integration/` within each package; fixtures in `test/fixtures/`
- HTTP mocking: msw
- Run all: `pnpm test`; scoped: `pnpm --filter <package> test`

## Code Style

- Linter/formatter: Biome (replaces ESLint + Prettier)
- Validation: valibot
- HTTP client: ky
- TypeScript strict mode; run `pnpm typecheck` to verify
- Auto-fixed on commit via lint-staged (`pnpm check:ci`)

## Package Conventions

- Source is ESM only (`import/export`); build output ships both ESM and CJS (generated automatically by TSDown — don't modify format settings)
- Build tool: TSDown; each package has a `tsdown.config.ts` extending `baseConfig` from `@aio-commerce-sdk/config-tsdown` via `mergeConfig`
- Scaffold new packages with `pnpm turbo gen create-package`
- Public packages: `@adobe/` scope (`"private": false`); internal: `@aio-commerce-sdk/` scope (`"private": true`)
- Monorepo-local deps use `workspace:*`; third-party deps use `catalog:` (defined in `pnpm-workspace.yaml`)
- Every public package must have `"sideEffects": false` in `package.json`
- `package.json` has two exports configs: `exports` (source paths, for local dev) and `publishConfig.exports` (dist paths, for consumers)
- Format Markdown with `pnpm format:markdown` (Prettier)
- JSDoc: use `@example` for non-obvious public APIs

# Workflow

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
- Before each commit, check if the changeset message still accurately describes the change
