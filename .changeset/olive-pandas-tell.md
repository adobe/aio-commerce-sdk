---
"@adobe/aio-commerce-plugin-app-migration": minor
---

Improved the `commerce-app-migrate` skill:

- `init` runs with the scoped package name (`npx --yes @adobe/aio-commerce-lib-app@latest init`) so first runs work without the library installed.
- pnpm projects get esbuild's build script approved (`onlyBuiltDependencies`) before init, with recovery guidance for `ERR_PNPM_IGNORED_BUILDS`.
- Descriptions over 255 characters are rewritten into a coherent shorter summary instead of truncated mid-sentence.
- The original `package.json` description is restored if `init` writes back the shortened config value.
- The migration summary opens with a one-line TL;DR.
