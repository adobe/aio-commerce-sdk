# @adobe/aio-commerce-lib-core

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
