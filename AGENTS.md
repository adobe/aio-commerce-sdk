# Codebase

## Project Structure

- pnpm monorepo managed with Turborepo; workspace packages in `packages/`, `packages-private/`, `configs/`, `turbo/`
- `packages/aio-commerce-sdk` — meta-package that re-exports all public libraries
- `packages/aio-commerce-lib-*` — individual public libraries (api, app, auth, config, core, events, webhooks)
- `packages-private/` — internal utilities not published to npm (common-utils, scripting-utils)
- `scripts/` (`@aio-commerce-sdk/scripts`) — workspace-wide scripting utilities (e.g. prepack/postpack hooks); private, not published
- Each package is self-contained: its own `package.json`, `tsconfig.json`, tests, and build output in `dist/`

## Commands

- `pnpm test` — run all tests (Vitest, with coverage)
- `pnpm typecheck` — TypeScript type-check across all packages
- `pnpm build` — build all packages via Turborepo
- `pnpm lint` — lint with Biome
- `pnpm check:ci` — runs automatically on commit via lint-staged
- Run scoped: `pnpm --filter @adobe/aio-commerce-lib-core test`
- Clear Turbo cache: `pnpm clean:turbo` (run before build if cached results look stale)
- Clean build artifacts: `pnpm clean:dist` — removes all `dist/` folders; `pnpm clean:all` — full reset (dist + node_modules)

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
- New packages are scaffolded manually (interactive): `pnpm turbo gen create-package`
- Public packages: `@adobe/` scope (`"private": false`); internal: `@aio-commerce-sdk/` scope (`"private": true`)
- Monorepo-local deps use `workspace:*`; third-party deps shared across multiple packages use `catalog:` (defined in `pnpm-workspace.yaml`)
- Every public package must declare `"sideEffects"` in `package.json`: `false` if no side effects, or an array of files that do have side effects
- `package.json` has two exports configs: `exports` (source paths, for local dev) and `publishConfig.exports` (dist paths, for consumers)
- Format Markdown with `pnpm format:markdown` (Prettier)


# Workflow

## Files

- Every source file **that supports comments** needs to include the following header, where <current_year> is the current calendar year.

  ```ts
  /*
   * Copyright <current_year> Adobe. All rights reserved.
   * This file is licensed to you under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License. You may obtain a copy
   * of the License at http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software distributed under
   * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
   * OF ANY KIND, either express or implied. See the License for the specific language
   * governing permissions and limitations under the License.
   */
  ```

## Documentation

Each package has it's own documentation under their own `docs` folder (except for the meta-package). This includes a general `usage.md` guide and an auto-generated API reference generated via Typedoc (`pnpm run docs`) using the JSDoc comments in the source. When implementing any changes, follow the below rules:

- Document only the public interface; internal helpers MUST NOT be documented.
- Never edit the auto-generated api reference manually, any change will be wiped out during regeneration.
- Never regenerate the API reference for PRs, they clutter the diff and complicate review. We will regenerate it before publishing.
- Never use emojis, of any kind, for public documentation.
- Ensure documentation is kept up to date on every change, including README (if applicable), `usage.md` (together with any other supporting doc if the documentation is fragmented), and the API reference (modified indirectly via the JSDoc).

### Comments

For source code comments, follow these rules:

- Never use comments to explain the WHAT, or the HOW. You should only use them to explain the WHY, and only as needed, don't over-document.
- Avoid justifying changes in the JSDoc, even if it's only an internal helper. It's okay to have comments explaining the rationale behind decisions, but keep them away from JSDoc. Either inline them in the code, or suggest the user to explain them during the PR creation.
- Document all public APIs you write with proper JSDoc; use `@example` for non-obvious usage; keep comments concise — don't restate what the types already say

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
