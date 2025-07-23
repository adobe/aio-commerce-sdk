# @adobe/aio-commerce-lib-auth

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
