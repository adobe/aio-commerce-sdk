# @adobe/aio-commerce-lib-auth

## 0.8.0

### Minor Changes

- [#217](https://github.com/adobe/aio-commerce-sdk/pull/217) [`6063a97`](https://github.com/adobe/aio-commerce-sdk/commit/6063a97299c9b44f663314420b59cee7998b2f89) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Introduced CLI utility `sync-ims-credentials` to sync the workspace credentials of `.aio` into the `.env` file environment variables expected by the library

## 0.7.0

### Minor Changes

- [#224](https://github.com/adobe/aio-commerce-sdk/pull/224) [`ac46985`](https://github.com/adobe/aio-commerce-sdk/commit/ac46985186961c65eddc6be3200dbe1e00369055) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Implement token forwarding utilities

### Patch Changes

- Updated dependencies [[`f2b6f34`](https://github.com/adobe/aio-commerce-sdk/commit/f2b6f34709a5adcca93b852b5855cb6b1c852312), [`f2b6f34`](https://github.com/adobe/aio-commerce-sdk/commit/f2b6f34709a5adcca93b852b5855cb6b1c852312)]:
  - @adobe/aio-commerce-lib-core@0.6.0

## 0.6.2

### Patch Changes

- [#153](https://github.com/adobe/aio-commerce-sdk/pull/153) [`3c88b74`](https://github.com/adobe/aio-commerce-sdk/commit/3c88b74ccfea0df06514b696ce8797c95e1acc4f) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Parse IMS scopes from potential string arrays, when resolving from a params object.

## 0.6.1

### Patch Changes

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - The IMS authentication schema has been updated to support both `string` and `string[]` inputs, automatically handling cases where you might have a single secret string, given in a non-array format (which is the expected).

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fixed an issue where the `resolve` utilities where asserting that the input was correct, which is expected, but they were not returning the output data of transformations applied during schema parsing, which caused some inputs to always be invalid, as the `params` objectonly handles primitives.

- Updated dependencies [[`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac)]:
  - @adobe/aio-commerce-lib-core@0.5.1

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
