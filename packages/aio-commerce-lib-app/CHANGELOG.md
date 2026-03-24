# @adobe/aio-commerce-lib-app

## 1.1.0

### Minor Changes

- [#273](https://github.com/adobe/aio-commerce-sdk/pull/273) [`660cf05`](https://github.com/adobe/aio-commerce-sdk/commit/660cf058d2439de82b3e22376c3d494b2a83045f) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Added the functionality to define and install webhooks in the installation flow of the app.

- [#285](https://github.com/adobe/aio-commerce-sdk/pull/285) [`cda7712`](https://github.com/adobe/aio-commerce-sdk/commit/cda7712ac74b3bd9700aaa243a8b67d3a3d74d91) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Added a new endpoint /installation/validation to perform validation before the app is installed. Added webhook-specific validation for possible conflicts.

### Patch Changes

- [#349](https://github.com/adobe/aio-commerce-sdk/pull/349) [`3abfe95`](https://github.com/adobe/aio-commerce-sdk/commit/3abfe9503f491aad3a2105d617fc8aa1c7b4725e) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Normalize event names and application IDs to lowercase to prevent case-sensitivity issues and ensure consistent event delivery.

- [#343](https://github.com/adobe/aio-commerce-sdk/pull/343) [`4883afa`](https://github.com/adobe/aio-commerce-sdk/commit/4883afaec90451cd7daf280f0def83ea45a3c87c) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Fixed IMS client secret parsing logic for the webhook subscription

- [#310](https://github.com/adobe/aio-commerce-sdk/pull/310) [`8f6ad9d`](https://github.com/adobe/aio-commerce-sdk/commit/8f6ad9ddcaae0f0a5a116bcbbefaae49f97697eb) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Improved validation error messages across schema files.

- Updated dependencies [[`660cf05`](https://github.com/adobe/aio-commerce-sdk/commit/660cf058d2439de82b3e22376c3d494b2a83045f), [`cb9c11d`](https://github.com/adobe/aio-commerce-sdk/commit/cb9c11dfd243d3034763374fe5416645015b46a9), [`4883afa`](https://github.com/adobe/aio-commerce-sdk/commit/4883afaec90451cd7daf280f0def83ea45a3c87c)]:
  - @adobe/aio-commerce-lib-webhooks@0.1.0
  - @adobe/aio-commerce-lib-auth@1.0.1
  - @adobe/aio-commerce-lib-api@1.0.1
  - @adobe/aio-commerce-lib-events@1.0.1
  - @adobe/aio-commerce-lib-config@1.0.3

## 1.0.2

### Patch Changes

- [#318](https://github.com/adobe/aio-commerce-sdk/pull/318) [`dac677f`](https://github.com/adobe/aio-commerce-sdk/commit/dac677f2ebb7841f78a11919af8f145de57024bf) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix an issue where a not-needed input causes installation errors.

- Updated dependencies [[`452dc94`](https://github.com/adobe/aio-commerce-sdk/commit/452dc940a6f9ea48b63260dfb80830b7bee0ec79)]:
  - @adobe/aio-commerce-lib-config@1.0.2

## 1.0.1

### Patch Changes

- [#295](https://github.com/adobe/aio-commerce-sdk/pull/295) [`933dc20`](https://github.com/adobe/aio-commerce-sdk/commit/933dc203d3afdb04576b85a4748392d5afe3d41b) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Fix commerce event name validation so that it can also accept multiple dot-separated segments.

- Updated dependencies [[`0e99a06`](https://github.com/adobe/aio-commerce-sdk/commit/0e99a0645d284f4d05dd1859ccad4d958268d576)]:
  - @adobe/aio-commerce-lib-config@1.0.1
  - @adobe/aio-commerce-lib-auth@1.0.0
  - @adobe/aio-commerce-lib-events@1.0.0

## 1.0.0

### Major Changes

- [#271](https://github.com/adobe/aio-commerce-sdk/pull/271) [`0170e73`](https://github.com/adobe/aio-commerce-sdk/commit/0170e7340d28367a6f001c9b2ff7e1ec0874a49b) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Turn `get-app-config` into a REST-like `app-config` runtime action.

- [#271](https://github.com/adobe/aio-commerce-sdk/pull/271) [`0170e73`](https://github.com/adobe/aio-commerce-sdk/commit/0170e7340d28367a6f001c9b2ff7e1ec0874a49b) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Introduce `config` and `scope-tree` runtime actions with REST-like API for business configuration.

- [#294](https://github.com/adobe/aio-commerce-sdk/pull/294) [`6d5b16a`](https://github.com/adobe/aio-commerce-sdk/commit/6d5b16a7659ab0d83b251921ac478ff7faf0d4e5) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - General Availability (GA) release of the Adobe Commerce SDK and all libraries.

- [#287](https://github.com/adobe/aio-commerce-sdk/pull/287) [`fc16aae`](https://github.com/adobe/aio-commerce-sdk/commit/fc16aaec9b459b58e368379bc3127c3e0d698c6a) Thanks [@oshmyheliuk](https://github.com/oshmyheliuk)! - Changed case format from camelCase to snake_case for Commerce eventing API

### Patch Changes

- [#274](https://github.com/adobe/aio-commerce-sdk/pull/274) [`d599ba8`](https://github.com/adobe/aio-commerce-sdk/commit/d599ba8ae30d3139d4ba19d0c63eaf716603f25f) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix typo: `prioritary` should be `priority`

- [#267](https://github.com/adobe/aio-commerce-sdk/pull/267) [`8642288`](https://github.com/adobe/aio-commerce-sdk/commit/8642288be4efd44b375d47e7cb75adb038c08334) Thanks [@jnatherley](https://github.com/jnatherley)! - Implements a rolldown plugin to correctly externalize transitive dependencies of private packages during build, but keep the source code of those same packages bundled.

- [#277](https://github.com/adobe/aio-commerce-sdk/pull/277) [`b706ac7`](https://github.com/adobe/aio-commerce-sdk/commit/b706ac73042df4df1f7f77da3d58b7042a65ae9a) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Optimize generated `actions` by exposing runtime actions in individual entrypoints.

- [#264](https://github.com/adobe/aio-commerce-sdk/pull/264) [`ac8203f`](https://github.com/adobe/aio-commerce-sdk/commit/ac8203f6c9d380dc0c337cc173ea730e66a36439) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Support word characters, hyphens, underscores, and dots for external event names

- [#293](https://github.com/adobe/aio-commerce-sdk/pull/293) [`86443ef`](https://github.com/adobe/aio-commerce-sdk/commit/86443ef71570c1cbbb3b7398f712157b73933f31) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Support any casing in the `runtimeActions` property of the `app.commerce.config` for events.

- [#269](https://github.com/adobe/aio-commerce-sdk/pull/269) [`a502120`](https://github.com/adobe/aio-commerce-sdk/commit/a502120d8c16fdc1ed4afc579c5cfd79ec56c8e0) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Use a safe CLI wrapper to ensure binaries can always be linked

- Updated dependencies [[`d599ba8`](https://github.com/adobe/aio-commerce-sdk/commit/d599ba8ae30d3139d4ba19d0c63eaf716603f25f), [`8642288`](https://github.com/adobe/aio-commerce-sdk/commit/8642288be4efd44b375d47e7cb75adb038c08334), [`0170e73`](https://github.com/adobe/aio-commerce-sdk/commit/0170e7340d28367a6f001c9b2ff7e1ec0874a49b), [`6d5b16a`](https://github.com/adobe/aio-commerce-sdk/commit/6d5b16a7659ab0d83b251921ac478ff7faf0d4e5), [`0170e73`](https://github.com/adobe/aio-commerce-sdk/commit/0170e7340d28367a6f001c9b2ff7e1ec0874a49b), [`a502120`](https://github.com/adobe/aio-commerce-sdk/commit/a502120d8c16fdc1ed4afc579c5cfd79ec56c8e0), [`6d5b16a`](https://github.com/adobe/aio-commerce-sdk/commit/6d5b16a7659ab0d83b251921ac478ff7faf0d4e5), [`fc16aae`](https://github.com/adobe/aio-commerce-sdk/commit/fc16aaec9b459b58e368379bc3127c3e0d698c6a), [`0170e73`](https://github.com/adobe/aio-commerce-sdk/commit/0170e7340d28367a6f001c9b2ff7e1ec0874a49b), [`3398078`](https://github.com/adobe/aio-commerce-sdk/commit/33980787b7874a3615b5946b76af1af36153cf76)]:
  - @adobe/aio-commerce-lib-events@1.0.0
  - @adobe/aio-commerce-lib-config@1.0.0
  - @adobe/aio-commerce-lib-auth@1.0.0
  - @adobe/aio-commerce-lib-core@1.0.0
  - @adobe/aio-commerce-lib-api@1.0.0

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
