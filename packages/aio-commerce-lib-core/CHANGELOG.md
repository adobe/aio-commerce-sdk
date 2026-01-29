# @adobe/aio-commerce-lib-core

## 0.6.0

### Minor Changes

- [#144](https://github.com/adobe/aio-commerce-sdk/pull/144) [`f2b6f34`](https://github.com/adobe/aio-commerce-sdk/commit/f2b6f34709a5adcca93b852b5855cb6b1c852312) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add various header utilities

- [#144](https://github.com/adobe/aio-commerce-sdk/pull/144) [`f2b6f34`](https://github.com/adobe/aio-commerce-sdk/commit/f2b6f34709a5adcca93b852b5855cb6b1c852312) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add a common type alias for `RuntimeActionParams`

## 0.5.1

### Patch Changes

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add a new success response preset for HTTP 203 status code: `nonAuthoritativeInformation`

## 0.5.0

### Minor Changes

- [#116](https://github.com/adobe/aio-commerce-sdk/pull/116) [`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add new `params` entrypoint for utilities related to runtime action params

- [#116](https://github.com/adobe/aio-commerce-sdk/pull/116) [`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add new `responses` entrypoint for utilities related to runtime action responses

- [#122](https://github.com/adobe/aio-commerce-sdk/pull/122) [`493da95`](https://github.com/adobe/aio-commerce-sdk/commit/493da9595c06de304ecddbbc8295db124cb6fcba) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Add new `./responses` export path providing response builder utilities (`buildErrorResponse`, `buildSuccessResponse`), response presets, and related types

## 0.4.1

### Patch Changes

- [#54](https://github.com/adobe/aio-commerce-sdk/pull/54) [`412af7a`](https://github.com/adobe/aio-commerce-sdk/commit/412af7a0b0a40f24b6fddafc7de76807de800724) Thanks [@jnatherley](https://github.com/jnatherley)! - Package requires for cjs loader are broken in @adobe/aio-commerce-lib-core, this release fixes it

## 0.4.0

### Minor Changes

- [#46](https://github.com/adobe/aio-commerce-sdk/pull/46) [`4b75585`](https://github.com/adobe/aio-commerce-sdk/commit/4b75585c0d27bd472de3277be5ddaf6a977664de) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Removed namespaced exports for index module

## 0.3.0

### Minor Changes

- [#22](https://github.com/adobe/aio-commerce-sdk/pull/22) [`9885eee`](https://github.com/adobe/aio-commerce-sdk/commit/9885eee5849ba7939b2067d3357e677beced3774) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Changes include:
  - Removed the `Result` utilities.
  - Removed the `Validation` utilities.
  - Added `CommerceSdkValidationError` and `CommerceSdkErrorBase` as new error types for better error handling

## 0.2.0

### Minor Changes

- [#18](https://github.com/adobe/aio-commerce-sdk/pull/18) [`aadbff1`](https://github.com/adobe/aio-commerce-sdk/commit/aadbff1acd08120f9d5cb8db4e3c849f552d8c79) Thanks [@jnatherley](https://github.com/jnatherley)! - Introduces the `aio-commerce-lib-core` package, which contains core utilities for the AIO Commerce SDK. It includes:
  - A `Result` type based on Rust's `Result` type, to do better error handling.
  - A set of validation utilities, including pretty printing of validation errors, and custom validation error types.
  - Refactor aio-commerce-lib-auth to use aio-commerce-lib-core

  Implements validation for the `aio-commerce-lib-auth` operations via `valibot`.
