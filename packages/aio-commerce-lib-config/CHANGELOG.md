# @adobe/aio-commerce-lib-config

## 0.8.1

### Patch Changes

- [#167](https://github.com/adobe/aio-commerce-sdk/pull/167) [`2745786`](https://github.com/adobe/aio-commerce-sdk/commit/274578686e07261b68d912adfa4bae040a807c3a) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fixes a bug with the `generate schema` command where it was not inferring the correct command based on the package manager.

- [#167](https://github.com/adobe/aio-commerce-sdk/pull/167) [`2745786`](https://github.com/adobe/aio-commerce-sdk/commit/274578686e07261b68d912adfa4bae040a807c3a) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Export the following types: `SelectorBy`, `SelectorByCode`, `SelectorByCodeAndLevel`, and `SelectorByScopeId`.

- Updated dependencies [[`2745786`](https://github.com/adobe/aio-commerce-sdk/commit/274578686e07261b68d912adfa4bae040a807c3a)]:
  - @adobe/aio-commerce-lib-api@0.4.0

## 0.8.0

### Minor Changes

- [#163](https://github.com/adobe/aio-commerce-sdk/pull/163) [`4a66b81`](https://github.com/adobe/aio-commerce-sdk/commit/4a66b810c106e5d00f3392c7c3fc142aa3aef2d5) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - [BREAKING] Refactor library to use tree-shakeable function-based API instead of class-based initialization pattern

  **Breaking Changes**

  **Removed `init()` function**

  The library no longer uses an initialization function. Instead, all functions are exported directly from the module.

  **Before:**

  ```typescript
  import { init } from "@adobe/aio-commerce-lib-config";

  const config = init();
  await config.getConfigSchema();
  ```

  **After:**

  ```typescript
  import * as libConfig from "@adobe/aio-commerce-lib-config";

  await libConfig.getConfigSchema();
  ```

  **Function signature changes**

  All functions now accept an optional `options` object as the last parameter for configuration options (`cacheTimeout`). Some examples:

  **`getScopeTree()`**

  **Before:**

  ```typescript
  await config.getScopeTree(remoteFetch?: boolean);
  ```

  **After:**

  ```typescript
  // For cached data (default)
  await libConfig.getScopeTree();

  // For fresh data from Commerce API
  await libConfig.getScopeTree({
    refreshData: true,
    commerceConfig: {
      /* Commerce client config */
    },
  });
  ```

  **`syncCommerceScopes()`**

  **Before:**

  ```typescript
  const config = init({ commerce: commerceConfig });
  await config.syncCommerceScopes();
  ```

  **After:**

  ```typescript
  await libConfig.syncCommerceScopes(commerceConfig, { cacheTimeout: 600 });
  ```

  **New `setGlobalLibConfigOptions()` function**

  You can now set global defaults for `cacheTimeout` that will be used by all functions:

  **Before:**

  ```typescript
  import { init } from "@adobe/aio-commerce-lib-config";

  const config = init({
    cacheTimeout: 3600,
  });
  ```

  **After:**

  ```typescript
  import { setGlobalLibConfigOptions } from "@adobe/aio-commerce-lib-config";

  // If not customized, the default cache timeout will be used (300 seconds)
  setGlobalLibConfigOptions({
    cacheTimeout: 3600,
  });
  ```

  **Migration Guide**
  1. Replace `import { init }` with `import * as libConfig` or use named imports
  2. Remove all `const config = init()` calls
  3. For `getScopeTree()` with `remoteFetch: true`, use the new `refreshData: true` pattern with `commerceConfig`
  4. For `syncCommerceScopes()`, pass `commerceConfig` directly as the first parameter

- [#163](https://github.com/adobe/aio-commerce-sdk/pull/163) [`4a66b81`](https://github.com/adobe/aio-commerce-sdk/commit/4a66b810c106e5d00f3392c7c3fc142aa3aef2d5) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - [BREAKING] Refactor API to use selector pattern and improve type safety

  **Breaking Changes**

  **Scope Selection API Refactoring**

  The configuration functions (`getConfiguration`, `getConfigurationByKey`, `setConfiguration`) now use a selector-based API instead of positional arguments with `...args`. This provides better type safety and clearer API usage.

  **Before:**

  ```typescript
  import * as libConfig from "@adobe/aio-commerce-lib-config";

  // Ambiguous - which argument is which?
  await libConfig.getConfiguration("scope-id");
  await libConfig.getConfiguration("website", "website");
  await libConfig.getConfiguration("website");
  ```

  **After:**

  ```typescript
  import {
    getConfiguration,
    byScopeId,
    byCodeAndLevel,
    byCode,
  } from "@adobe/aio-commerce-lib-config";

  // Clear and type-safe
  await getConfiguration(byScopeId("scope-id"));
  await getConfiguration(byCodeAndLevel("website", "website"));
  await getConfiguration(byCode("website"));
  ```

  **New Selector Helper Functions**

  Three new helper functions are exported to create selector objects:
  - `byScopeId(scopeId: string)` - Select a scope by its unique ID
  - `byCodeAndLevel(code: string, level: string)` - Select a scope by code and level
  - `byCode(code: string)` - Select a scope by code (uses default level)

  **Migration Guide**
  1. Replace positional arguments with selector helper functions:
     - `getConfiguration("scope-id")` → `getConfiguration(byScopeId("scope-id"))`
     - `getConfiguration("website", "website")` → `getConfiguration(byCodeAndLevel("website", "website"))`
     - `getConfiguration("website")` → `getConfiguration(byCode("website"))`

  **Documentation Improvements**
  - Added comprehensive JSDoc comments with examples for all public API functions
  - Added JSDoc comments for internal module functions with `@param` and `@throws` documentation
  - Improved type documentation with descriptions

### Patch Changes

- [#163](https://github.com/adobe/aio-commerce-sdk/pull/163) [`4a66b81`](https://github.com/adobe/aio-commerce-sdk/commit/4a66b810c106e5d00f3392c7c3fc142aa3aef2d5) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fixes a bug where the validation of business configuration schemas always succeeded as it never was actually performing a validation.

- [#163](https://github.com/adobe/aio-commerce-sdk/pull/163) [`4a66b81`](https://github.com/adobe/aio-commerce-sdk/commit/4a66b810c106e5d00f3392c7c3fc142aa3aef2d5) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fixes usages of the library binaries by using the package name only instead of the fully qualified org + package name. The latter was causing the binary to always be fetched from NPM, instead of using the locally installed one.

## 0.7.2

### Patch Changes

- [#158](https://github.com/adobe/aio-commerce-sdk/pull/158) [`a9a7785`](https://github.com/adobe/aio-commerce-sdk/commit/a9a7785cb410fc482c0417f75c001ae4ff112dac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Remove Commerce inputs from `get-scope-tree` generated action. Fix formatting of generated `extensibility.config.js`. Fix unwanted changes when editing YAML files via the `init` script.

## 0.7.1

### Patch Changes

- [#155](https://github.com/adobe/aio-commerce-sdk/pull/155) [`6adc0b4`](https://github.com/adobe/aio-commerce-sdk/commit/6adc0b48112ef97abad86c5f62a12b8f41054fe9) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix minor linting issues reported by Biome in generated code

- Updated dependencies []:
  - @adobe/aio-commerce-lib-api@0.3.2

## 0.7.0

### Minor Changes

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Improved CLI scripts to handle projects written in both `CommonJS` and `ESM`. Support running the commands in directories different from the root.

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add a new `init` script to easily bootstrap an App Builder application to be used with `@adobe/aio-commerce-lib-config`, automating all manual steps

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add logging to all the generated runtime actions for debugging purposes

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add new schema types for configuration values: `password`, `email`, `tel`, `number`, `boolean`, `url` and `date`

### Patch Changes

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Configuration values of type `list` now require a `selectionMode` to be defined an no longer default to `single`. This is required because the `default` value for both of them are different (one is a simple string, the other a string array) and we need to discriminate against the `selectionMode` for type-safety.

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Set `LOG_LEVEL` input as an environment variable

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - The `sync-commerce-scopes` now returns a 203 status code if the scope data comes from the cache, together with an `x-cache: hit` custom header. If there's an error in the request, a 500 status code is returned.

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - All the generated code now is placed insde the `src` directory.

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Remove all logging in CLI commands made via `@adobe/aio-lib-core-logging`. Instead use `process.stdout` and `process.stderr` for better readability of log messages.

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Fix missing `AIO_COMMERCE_AUTH_IMS_SCOPES` input variable required for SaaS authentication.

- [#139](https://github.com/adobe/aio-commerce-sdk/pull/139) [`ad1c3aa`](https://github.com/adobe/aio-commerce-sdk/commit/ad1c3aa00a7bfcdafb9ee94521657b84433ff35d) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Add `AcceptableConfigValue` to the library public API

- [#143](https://github.com/adobe/aio-commerce-sdk/pull/143) [`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Modify `ext.config.yaml` generation to add some comments and use `flow` style for the `include` option.

- Updated dependencies [[`f05b041`](https://github.com/adobe/aio-commerce-sdk/commit/f05b0413b06a4dea5579a1b16c293aaf8b64ffac)]:
  - @adobe/aio-commerce-lib-core@0.5.1
  - @adobe/aio-commerce-lib-api@0.3.1

## 0.6.0

### Minor Changes

- [#137](https://github.com/adobe/aio-commerce-sdk/pull/137) [`3a33b41`](https://github.com/adobe/aio-commerce-sdk/commit/3a33b41253786534bb0ddb6635a7643e758497a0) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Remove hooks entrypoint and replace the `pre-app-build` hook with a simple CLI command.

## 0.5.1

### Patch Changes

- [#133](https://github.com/adobe/aio-commerce-sdk/pull/133) [`6d6cf9c`](https://github.com/adobe/aio-commerce-sdk/commit/6d6cf9c383dbcc0c9e47443d5ef5fadaf8adad72) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Use the `@adobe/aio-commerce-sdk` metapackage in the generated runtime actions

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
