# @adobe/aio-commerce-lib-config

## 0.5.0

### Minor Changes

- [#130](https://github.com/adobe/aio-commerce-sdk/pull/130) [`07cf4f5`](https://github.com/adobe/aio-commerce-sdk/commit/07cf4f590bb0641f21ca58dd0d8e7dfa817aaf0c) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Automatically generate configuration schema json file from `extensibility.config.js`

### Patch Changes

- [#132](https://github.com/adobe/aio-commerce-sdk/pull/132) [`e4f1e07`](https://github.com/adobe/aio-commerce-sdk/commit/e4f1e07fdb949e2f0a71bfbc9b94c10d114c00bc) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Search for the `ext.config.yaml` in a `commerce-configuration-1` folder instead of the workspace root. Use it as the home of the generated actions and the generated schema.

## 0.4.1

### Patch Changes

- [#128](https://github.com/adobe/aio-commerce-sdk/pull/128) [`8c6fd47`](https://github.com/adobe/aio-commerce-sdk/commit/8c6fd476761ae479d9afeb3b9829a628c93e564d) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Bundle patched version of `jiti` into the distribution files.

## 0.4.0

### Minor Changes

- [#125](https://github.com/adobe/aio-commerce-sdk/pull/125) [`94befad`](https://github.com/adobe/aio-commerce-sdk/commit/94befadca96f695869c7bf2c692c14d4b8484917) Thanks [@emartinpalomas](https://github.com/emartinpalomas)! - Add optional selectionMode field to list schema type supporting single and multiple selection modes

- [#127](https://github.com/adobe/aio-commerce-sdk/pull/127) [`e62803c`](https://github.com/adobe/aio-commerce-sdk/commit/e62803cef5721519d0c975cfb1546ff05d0cb703) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Move business config schema location from `init-files/configuration-schema.json` to `extensibility.config.js`

## 0.3.1

### Patch Changes

- [#123](https://github.com/adobe/aio-commerce-sdk/pull/123) [`3866e55`](https://github.com/adobe/aio-commerce-sdk/commit/3866e5548c9aa17f8f80b0aa85d75bfeaeea2f20) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Fix path for action templates

## 0.3.0

### Minor Changes

- [#105](https://github.com/adobe/aio-commerce-sdk/pull/105) [`e974b8a`](https://github.com/adobe/aio-commerce-sdk/commit/e974b8aa31fdd5dbb3a80125222dde49333e61c3) Thanks [@aminakhyat](https://github.com/apps/renovate)! - Update `@adobe/aio-lib-state` dependency to v5 for improved storage backend

- [#119](https://github.com/adobe/aio-commerce-sdk/pull/119) [`e5ad0f5`](https://github.com/adobe/aio-commerce-sdk/commit/e5ad0f514dd79cccaefa55f331c69e6768d628b9) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Enhance the library with the new resolver helpers of `@adobe/aio-commerce-lib-api` and the response helpers of `@adobe/aio-commerce-lib-core` to remove unnecessary logic. The library no longer exports `buildCommerceHttpClient`, `CommerceValidationError`, `createErrorResponse` and `createSuccessResponse`

- [#112](https://github.com/adobe/aio-commerce-sdk/pull/112) [`b41a47b`](https://github.com/adobe/aio-commerce-sdk/commit/b41a47bfb7b09294c8ce3d607cd5a95553ad5ec8) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Remove unnecessary symbols from public API entrypoint, leaving only those that are actually needed

### Patch Changes

- [#113](https://github.com/adobe/aio-commerce-sdk/pull/113) [`5fc2c17`](https://github.com/adobe/aio-commerce-sdk/commit/5fc2c17b646d62a8f773da42109d08404cdaf2aa) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Support optional `description` field in configuration schema validation

- Updated dependencies [[`9079402`](https://github.com/adobe/aio-commerce-sdk/commit/90794023b30ba749e2a1e8278584e4804ad45e1e), [`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81), [`176bd0f`](https://github.com/adobe/aio-commerce-sdk/commit/176bd0f793de8dbd11b1704a82dd722158f48e81), [`9079402`](https://github.com/adobe/aio-commerce-sdk/commit/90794023b30ba749e2a1e8278584e4804ad45e1e), [`493da95`](https://github.com/adobe/aio-commerce-sdk/commit/493da9595c06de304ecddbbc8295db124cb6fcba)]:
  - @adobe/aio-commerce-lib-api@0.3.0
  - @adobe/aio-commerce-lib-core@0.5.0

## 0.2.0

### Minor Changes

- [#108](https://github.com/adobe/aio-commerce-sdk/pull/108) [`1219b03`](https://github.com/adobe/aio-commerce-sdk/commit/1219b03de6067984365f69499a152c61a4190a2d) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Include actions' templates in npm package

- [#111](https://github.com/adobe/aio-commerce-sdk/pull/111) [`0a19ce6`](https://github.com/adobe/aio-commerce-sdk/commit/0a19ce63adbedf5fcd1a5b8a6b58885c8f799c78) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Fix action templates code

## 0.1.0

### Minor Changes

- [#100](https://github.com/adobe/aio-commerce-sdk/pull/100) [`33a68dd`](https://github.com/adobe/aio-commerce-sdk/commit/33a68dd1495e14d9036dd8b2159c4644505494c7) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Create business config library

### Patch Changes

- Updated dependencies []:
  - @adobe/aio-commerce-lib-api@0.2.1
