# @adobe/aio-commerce-lib-auth

## 0.6.0

### Minor Changes

- [#118](https://github.com/adobe/aio-commerce-sdk/pull/118) [`9079402`](https://github.com/adobe/aio-commerce-sdk/commit/90794023b30ba749e2a1e8278584e4804ad45e1e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add new `isImsAuthProvider` and `isIntegrationAuthProvider` helpers to distinguish between different auth providers

- [#117](https://github.com/adobe/aio-commerce-sdk/pull/117) [`fd6a1b5`](https://github.com/adobe/aio-commerce-sdk/commit/fd6a1b531aaea399fea875c8e1e03002790cb1f4) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Adds a new `resolveAuthParams` utility to all auth providers that automatically creates valid authentication param containers from the given unknown runtime action params.

### Patch Changes

- Updated dependencies [[`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81), [`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81), [`493da95`](https://github.com/adobe/aio-commerce-sdk/commit/493da9595c06de304ecddbbc8295db124cb6fcba)]:
  - @adobe/aio-commerce-lib-core@0.5.0

## 0.5.0

### Minor Changes

- [#95](https://github.com/adobe/aio-commerce-sdk/pull/95) [`abd5012`](https://github.com/adobe/aio-commerce-sdk/commit/abd5012e5680f97abd150de6036b2225c7dc0277) Thanks [@iivvaannxx](https://github.com/apps/renovate)! - [Breaking] Ensure `UrlSchema` is used when validating the input URL of Commerce Integration Auth. Now, if the input URL is not in the expected format it will throw.

## 0.4.0

### Minor Changes

- [#81](https://github.com/adobe/aio-commerce-sdk/pull/81) [`e0db24c`](https://github.com/adobe/aio-commerce-sdk/commit/e0db24c04aed9a6df72e80d5395aa41374570b6a) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Remove `IMS_AUTH_ENV` enum and replace it with a simple union. Remove default value from `environment` in `ImsAuthParams` as `prod` is used by default.

## 0.3.4

### Patch Changes

- [#61](https://github.com/adobe/aio-commerce-sdk/pull/61) [`e2fb844`](https://github.com/adobe/aio-commerce-sdk/commit/e2fb8441fc1c3394bf2b197932bdc368511ab0ea) Thanks [@jnatherley](https://github.com/jnatherley)! - The ESM build of @adobe/aio-commerce-lib-auth fails when imported into ESM projects due to incompatible import statements for the CommonJS dependency @adobe/aio-lib-ims.

  ```bash
  file:///path/to/node_modules/@adobe/aio-commerce-lib-auth/dist/es/index.js:15
  import { context, getToken } from "@adobe/aio-lib-ims";
                    ^^^^^^^^
  SyntaxError: Named export 'getToken' not found. The requested module '@adobe/aio-lib-ims' is a CommonJS module, which may not support all module.exports as named exports.
  ```

  **Affected Versions**

  @adobe/aio-commerce-lib-auth: All versions with ESM distribution
  Occurs when using Node.js native ESM (projects with "type": "module" in package.json)

  **Root Cause**

  The library's ESM distribution (/dist/es/index.js) attempts to use named imports from @adobe/aio-lib-ims, which is a CommonJS module. Node.js ESM cannot directly import named exports from CommonJS modules, requiring the use of default imports instead.

## 0.3.3

### Patch Changes

- Updated dependencies [[`412af7a`](https://github.com/adobe/aio-commerce-sdk/commit/412af7a0b0a40f24b6fddafc7de76807de800724)]:
  - @adobe/aio-commerce-lib-core@0.4.1

## 0.3.2

### Patch Changes

- [`08edb37`](https://github.com/adobe/aio-commerce-sdk/commit/08edb372c6b1a97ffed26d5f84b1c189bd6bd330) Thanks [@jnatherley](https://github.com/jnatherley)! - `ImsAuthConfig.context` could be received as `undefined` by the `context.set` method, after an `assertImsAuthParams` due to us discarding the Valibot output (which was setting a default). Now, the value is manually defaulted if not set.

- [`0b37a82`](https://github.com/adobe/aio-commerce-sdk/commit/0b37a821f3a7d8c8acd1d2bb16e12b55a5ec7c71) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix small typo in validation message of `stringArray` schema.

## 0.3.1

### Patch Changes

- Updated dependencies [[`4b75585`](https://github.com/adobe/aio-commerce-sdk/commit/4b75585c0d27bd472de3277be5ddaf6a977664de)]:
  - @adobe/aio-commerce-lib-core@0.4.0

## 0.3.0

### Minor Changes

- [#22](https://github.com/adobe/aio-commerce-sdk/pull/22) [`9885eee`](https://github.com/adobe/aio-commerce-sdk/commit/9885eee5849ba7939b2067d3357e677beced3774) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Changes include:
  - Removed `try*` methods from public interface
  - Added `assert` methods that throw if required configuration is not provided
  - Cleaned up unused types to reduce bundle size

### Patch Changes

- Updated dependencies [[`9885eee`](https://github.com/adobe/aio-commerce-sdk/commit/9885eee5849ba7939b2067d3357e677beced3774)]:
  - @adobe/aio-commerce-lib-core@0.3.0

## 0.2.0

### Minor Changes

- [#18](https://github.com/adobe/aio-commerce-sdk/pull/18) [`aadbff1`](https://github.com/adobe/aio-commerce-sdk/commit/aadbff1acd08120f9d5cb8db4e3c849f552d8c79) Thanks [@jnatherley](https://github.com/jnatherley)! - Introduces the `aio-commerce-lib-core` package, which contains core utilities for the AIO Commerce SDK. It includes:
  - A `Result` type based on Rust's `Result` type, to do better error handling.
  - A set of validation utilities, including pretty printing of validation errors, and custom validation error types.
  - Refactor aio-commerce-lib-auth to use aio-commerce-lib-core

  Implements validation for the `aio-commerce-lib-auth` operations via `valibot`.

### Patch Changes

- Updated dependencies [[`aadbff1`](https://github.com/adobe/aio-commerce-sdk/commit/aadbff1acd08120f9d5cb8db4e3c849f552d8c79)]:
  - @adobe/aio-commerce-lib-core@0.2.0

## 0.1.0

### Minor Changes

- [#11](https://github.com/adobe/aio-commerce-sdk/pull/11) [`97e031f`](https://github.com/adobe/aio-commerce-sdk/commit/97e031ffc19d882293653c5bbbb0210a6d0199b2) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Initial alpha release. This release is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.
