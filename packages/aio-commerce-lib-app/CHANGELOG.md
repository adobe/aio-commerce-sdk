# @adobe/aio-commerce-lib-app

## 0.3.2

### Patch Changes

- [#262](https://github.com/adobe/aio-commerce-sdk/pull/262) [`7cb9252`](https://github.com/adobe/aio-commerce-sdk/commit/7cb9252736acd34f5490e2dc940b74a7ec40f17c) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Dependencies should be installed early in the init process.

## 0.3.1

### Patch Changes

- [#260](https://github.com/adobe/aio-commerce-sdk/pull/260) [`dbfb82f`](https://github.com/adobe/aio-commerce-sdk/commit/dbfb82fe4af72fe760df005506bec9f9927bbafc) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix package json detection/creation on `init` script

## 0.3.0

### Minor Changes

- [#259](https://github.com/adobe/aio-commerce-sdk/pull/259) [`f05088d`](https://github.com/adobe/aio-commerce-sdk/commit/f05088dfb3392bb8d6c41cdc4216dc40f94ae705) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add new `hooks` and `init` scripts. Make code generation process smart based on application configuration.

### Patch Changes

- [#254](https://github.com/adobe/aio-commerce-sdk/pull/254) [`d437000`](https://github.com/adobe/aio-commerce-sdk/commit/d4370008bafe2540ff654bdab1381beab4be85e1) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Relax casing constraints for display names in schema. Ensure custom steps can't have duplicate names.

- Updated dependencies []:
  - @adobe/aio-commerce-lib-auth@0.8.1
  - @adobe/aio-commerce-lib-events@0.6.0

## 0.2.0

### Minor Changes

- [#246](https://github.com/adobe/aio-commerce-sdk/pull/246) [`b3b41f5`](https://github.com/adobe/aio-commerce-sdk/commit/b3b41f576cf0341bbb4a19bb534bfe35fb562aad) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix `installation` action template to use the new `HttpActionRouter`

- [#252](https://github.com/adobe/aio-commerce-sdk/pull/252) [`f6663ff`](https://github.com/adobe/aio-commerce-sdk/commit/f6663ffd2a508ac0128ef8fc573ed1c10427a836) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add support for configuring Commerce Eventing module during installation

- [#236](https://github.com/adobe/aio-commerce-sdk/pull/236) [`50c5538`](https://github.com/adobe/aio-commerce-sdk/commit/50c553809c7c699026d4952487295f5c25b7d1f0) Thanks [@jnatherley](https://github.com/jnatherley)! - Add support for installing commerce event subscriptions.

- [#221](https://github.com/adobe/aio-commerce-sdk/pull/221) [`24b391f`](https://github.com/adobe/aio-commerce-sdk/commit/24b391f911a64786df0e6ef695d6baaf4c467ea2) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add `eventing` section in configuration schema of `app.commerce.config`

- [#241](https://github.com/adobe/aio-commerce-sdk/pull/241) [`2707605`](https://github.com/adobe/aio-commerce-sdk/commit/2707605b914b7aab3f7700f845bc8e27f48958ca) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Implement installation flow for I/O Providers and Event Metadata.

- [#242](https://github.com/adobe/aio-commerce-sdk/pull/242) [`4a9a407`](https://github.com/adobe/aio-commerce-sdk/commit/4a9a407e8141687e7507ba1f4bc85bfb3e4a144e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add support for installing event registrations.

- [#251](https://github.com/adobe/aio-commerce-sdk/pull/251) [`9566d2b`](https://github.com/adobe/aio-commerce-sdk/commit/9566d2b7c19c583e090be87c297384d1a49449b5) Thanks [@jcuerdo](https://github.com/jcuerdo)! - Enhance App Metadata Detail for Events:
  - Add rules to schema
  - Add source to fieldSchema

### Patch Changes

- [#247](https://github.com/adobe/aio-commerce-sdk/pull/247) [`74eae28`](https://github.com/adobe/aio-commerce-sdk/commit/74eae28a3a3145452cf9051ef6b51c1aa84ece96) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Added support for pre and post install messages in the configuration schema

- [#243](https://github.com/adobe/aio-commerce-sdk/pull/243) [`3fc7bfe`](https://github.com/adobe/aio-commerce-sdk/commit/3fc7bfe523092c10edabc017a0b3cbeb0fbee383) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Added support for custom installation steps

- Updated dependencies [[`4a9a407`](https://github.com/adobe/aio-commerce-sdk/commit/4a9a407e8141687e7507ba1f4bc85bfb3e4a144e), [`2707605`](https://github.com/adobe/aio-commerce-sdk/commit/2707605b914b7aab3f7700f845bc8e27f48958ca), [`50c5538`](https://github.com/adobe/aio-commerce-sdk/commit/50c553809c7c699026d4952487295f5c25b7d1f0), [`f6663ff`](https://github.com/adobe/aio-commerce-sdk/commit/f6663ffd2a508ac0128ef8fc573ed1c10427a836), [`9566d2b`](https://github.com/adobe/aio-commerce-sdk/commit/9566d2b7c19c583e090be87c297384d1a49449b5), [`b3b41f5`](https://github.com/adobe/aio-commerce-sdk/commit/b3b41f576cf0341bbb4a19bb534bfe35fb562aad), [`b3b41f5`](https://github.com/adobe/aio-commerce-sdk/commit/b3b41f576cf0341bbb4a19bb534bfe35fb562aad), [`b7fb4da`](https://github.com/adobe/aio-commerce-sdk/commit/b7fb4da5b8a9f468d4c33a25194dcc0a6e4d16a1)]:
  - @adobe/aio-commerce-lib-events@0.6.0
  - @adobe/aio-commerce-lib-core@0.6.1
  - @adobe/aio-commerce-lib-auth@0.8.1
  - @adobe/aio-commerce-lib-api@0.6.1

## 0.1.1

### Patch Changes

- [#224](https://github.com/adobe/aio-commerce-sdk/pull/224) [`ac46985`](https://github.com/adobe/aio-commerce-sdk/commit/ac46985186961c65eddc6be3200dbe1e00369055) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix target directory for runtime action templates being nested twice

- Updated dependencies [[`f2b6f34`](https://github.com/adobe/aio-commerce-sdk/commit/f2b6f34709a5adcca93b852b5855cb6b1c852312), [`f2b6f34`](https://github.com/adobe/aio-commerce-sdk/commit/f2b6f34709a5adcca93b852b5855cb6b1c852312)]:
  - @adobe/aio-commerce-lib-core@0.6.0

## 0.1.0

### Minor Changes

- [#196](https://github.com/adobe/aio-commerce-sdk/pull/196) [`ca14df8`](https://github.com/adobe/aio-commerce-sdk/commit/ca14df8d1b351e09cbd41c5315f7e34a2daa0394) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Transfer code from `@adobe/aio-commerce-lib-extensibility` and adapt naming for consistency

## 0.1.0

### Minor Changes

- [#177](https://github.com/adobe/aio-commerce-sdk/pull/177) [`6ab0c02`](https://github.com/adobe/aio-commerce-sdk/commit/6ab0c02cc3710514cd0904ac24c7fcb00735c825) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Implement `config` entrypoint for utilities related to `extensibility.config.js`

### Patch Changes

- [#183](https://github.com/adobe/aio-commerce-sdk/pull/183) [`a848588`](https://github.com/adobe/aio-commerce-sdk/commit/a8485880c6460624774c659985c44aaf91feb2b9) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix conflict between schema name and type name

- [#181](https://github.com/adobe/aio-commerce-sdk/pull/181) [`3bbc49e`](https://github.com/adobe/aio-commerce-sdk/commit/3bbc49e9fe1757cba9838417d8b7f3d0e9b38f63) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix bug that was causing non-default exports to not throw when loading extensibility config

- [#181](https://github.com/adobe/aio-commerce-sdk/pull/181) [`3bbc49e`](https://github.com/adobe/aio-commerce-sdk/commit/3bbc49e9fe1757cba9838417d8b7f3d0e9b38f63) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Remove `find-up` dependency
