# @adobe/aio-commerce-sdk

## 0.5.0

### Minor Changes

- [#101](https://github.com/adobe/aio-commerce-sdk/pull/101) [`82147b3`](https://github.com/adobe/aio-commerce-sdk/commit/82147b388e1b182e062c287a94209661053fe1f9) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Re-export `@adobe/aio-lib-commerce-api`. Add new `api`, `api/ky` and `api/utils` entrypoints that mimic the structure of the library.

### Patch Changes

- [#101](https://github.com/adobe/aio-commerce-sdk/pull/101) [`82147b3`](https://github.com/adobe/aio-commerce-sdk/commit/82147b388e1b182e062c287a94209661053fe1f9) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Re-export `@adobe/aio-commerce-lib-events`. Add new `events/commerce` and `events/io-events` entrypoints that mimic the structure of the library.

- Updated dependencies [[`abd5012`](https://github.com/adobe/aio-commerce-sdk/commit/abd5012e5680f97abd150de6036b2225c7dc0277), [`abd5012`](https://github.com/adobe/aio-commerce-sdk/commit/abd5012e5680f97abd150de6036b2225c7dc0277)]:
  - @adobe/aio-commerce-lib-events@0.3.1
  - @adobe/aio-commerce-lib-auth@0.5.0
  - @adobe/aio-commerce-lib-api@0.2.1

## 0.4.4

### Patch Changes

- Updated dependencies [[`e0db24c`](https://github.com/adobe/aio-commerce-sdk/commit/e0db24c04aed9a6df72e80d5395aa41374570b6a)]:
  - @adobe/aio-commerce-lib-auth@0.4.0

## 0.4.3

### Patch Changes

- Updated dependencies [[`e2fb844`](https://github.com/adobe/aio-commerce-sdk/commit/e2fb8441fc1c3394bf2b197932bdc368511ab0ea)]:
  - @adobe/aio-commerce-lib-auth@0.3.4

## 0.4.2

### Patch Changes

- Updated dependencies [[`412af7a`](https://github.com/adobe/aio-commerce-sdk/commit/412af7a0b0a40f24b6fddafc7de76807de800724)]:
  - @adobe/aio-commerce-lib-core@0.4.1
  - @adobe/aio-commerce-lib-auth@0.3.3

## 0.4.1

### Patch Changes

- Updated dependencies [[`08edb37`](https://github.com/adobe/aio-commerce-sdk/commit/08edb372c6b1a97ffed26d5f84b1c189bd6bd330), [`0b37a82`](https://github.com/adobe/aio-commerce-sdk/commit/0b37a821f3a7d8c8acd1d2bb16e12b55a5ec7c71)]:
  - @adobe/aio-commerce-lib-auth@0.3.2

## 0.4.0

### Minor Changes

- [#46](https://github.com/adobe/aio-commerce-sdk/pull/46) [`4b75585`](https://github.com/adobe/aio-commerce-sdk/commit/4b75585c0d27bd472de3277be5ddaf6a977664de) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Removed namespaced exports from index module

### Patch Changes

- Updated dependencies [[`4b75585`](https://github.com/adobe/aio-commerce-sdk/commit/4b75585c0d27bd472de3277be5ddaf6a977664de)]:
  - @adobe/aio-commerce-lib-core@0.4.0
  - @adobe/aio-commerce-lib-auth@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [[`9885eee`](https://github.com/adobe/aio-commerce-sdk/commit/9885eee5849ba7939b2067d3357e677beced3774), [`9885eee`](https://github.com/adobe/aio-commerce-sdk/commit/9885eee5849ba7939b2067d3357e677beced3774)]:
  - @adobe/aio-commerce-lib-auth@0.3.0
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
  - @adobe/aio-commerce-lib-auth@0.2.0
  - @adobe/aio-commerce-lib-core@0.2.0

## 0.1.0

### Minor Changes

- [#11](https://github.com/adobe/aio-commerce-sdk/pull/11) [`97e031f`](https://github.com/adobe/aio-commerce-sdk/commit/97e031ffc19d882293653c5bbbb0210a6d0199b2) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Initial alpha release. This release is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

### Patch Changes

- Updated dependencies [[`97e031f`](https://github.com/adobe/aio-commerce-sdk/commit/97e031ffc19d882293653c5bbbb0210a6d0199b2)]:
  - @adobe/aio-commerce-lib-auth@0.1.0
