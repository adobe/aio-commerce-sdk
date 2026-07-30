# @adobe/aio-commerce-plugin-app-migration

## 1.3.0

### Minor Changes

- [#593](https://github.com/adobe/aio-commerce-sdk/pull/593) [`554bc21`](https://github.com/adobe/aio-commerce-sdk/commit/554bc21fdaf745447ce0685bb7735da974f06904) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - `commerce-app-migrate` gains a `spectrum-s2-upgrade` reference so the migration executor can detect classic React Spectrum (v3) in a project's Admin UI `web-src` and offer to run the S1-to-S2 migration for the user.

- [#594](https://github.com/adobe/aio-commerce-sdk/pull/594) [`a947231`](https://github.com/adobe/aio-commerce-sdk/commit/a9472317626df39adcef9258a8bcaa2885b64826) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Improved the `commerce-app-migrate` skill:

  - `init` runs with the scoped package name (`npx --yes @adobe/aio-commerce-lib-app@latest init`) so first runs work without the library installed.
  - pnpm projects get esbuild's build script approved (`onlyBuiltDependencies`) before init, with recovery guidance for `ERR_PNPM_IGNORED_BUILDS`.
  - Descriptions over 255 characters are rewritten into a coherent shorter summary instead of truncated mid-sentence.
  - The original `package.json` description is restored if `init` writes back the shortened config value.
  - The migration summary opens with a one-line TL;DR.

## 1.2.0

### Minor Changes

- [#540](https://github.com/adobe/aio-commerce-sdk/pull/540) [`6382582`](https://github.com/adobe/aio-commerce-sdk/commit/638258247f806f39c83f1f7156d4f65f94023009) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Promote Commerce plugins through the stable skills release process.
