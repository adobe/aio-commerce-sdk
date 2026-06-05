# @adobe/aio-commerce-lib-webhooks

## 1.1.2

### Patch Changes

- [#498](https://github.com/adobe/aio-commerce-sdk/pull/498) [`f6aec01`](https://github.com/adobe/aio-commerce-sdk/commit/f6aec01a22ed185fe130170751353fae881c0f2d) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Fix the webhook exception operation to emit the exception class under the `type` field instead of `class`, matching the Adobe Commerce webhook response spec. Previously the supplied exception class was ignored by Commerce.

## 1.1.1

### Patch Changes

- Updated dependencies [[`ec2d426`](https://github.com/adobe/aio-commerce-sdk/commit/ec2d4262166bde68a434025667f38609313ad712)]:
  - @adobe/aio-commerce-lib-api@1.2.1
  - @adobe/aio-commerce-lib-core@1.1.1

## 1.1.0

### Minor Changes

- [#345](https://github.com/adobe/aio-commerce-sdk/pull/345) [`38adb09`](https://github.com/adobe/aio-commerce-sdk/commit/38adb09e1e2bd1b8fa764ecc2e0d21ecc0071ca7) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Drop Node 20 support (EOL April 2026).

### Patch Changes

- Updated dependencies [[`38adb09`](https://github.com/adobe/aio-commerce-sdk/commit/38adb09e1e2bd1b8fa764ecc2e0d21ecc0071ca7)]:
  - @adobe/aio-commerce-lib-api@1.2.0
  - @adobe/aio-commerce-lib-core@1.1.0

## 1.0.0

### Major Changes

- [#407](https://github.com/adobe/aio-commerce-sdk/pull/407) [`aa2ac1a`](https://github.com/adobe/aio-commerce-sdk/commit/aa2ac1a33df543c7f62675f1c920722969fc0a30) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Bump version to first stable `1.0.0`.

### Patch Changes

- Updated dependencies [[`aeb0411`](https://github.com/adobe/aio-commerce-sdk/commit/aeb0411521c0cd8bc9e878beb160eeb92e98d090)]:
  - @adobe/aio-commerce-lib-api@1.1.0

## 0.1.0

### Minor Changes

- [#273](https://github.com/adobe/aio-commerce-sdk/pull/273) [`660cf05`](https://github.com/adobe/aio-commerce-sdk/commit/660cf058d2439de82b3e22376c3d494b2a83045f) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Added a new package to manage Commerce webhooks.
  This package provides utilities to manage webhooks in Adobe Commerce such as subscribing, unsubscribing, and listing webhooks.

### Patch Changes

- [#186](https://github.com/adobe/aio-commerce-sdk/pull/186) [`cb9c11d`](https://github.com/adobe/aio-commerce-sdk/commit/cb9c11dfd243d3034763374fe5416645015b46a9) Thanks [@obarcelonap](https://github.com/obarcelonap)! - Provide type-safe helpers for Adobe Commerce webhook operations

- Updated dependencies []:
  - @adobe/aio-commerce-lib-api@1.0.1
