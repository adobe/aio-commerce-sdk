# Breaking Changes

> [!IMPORTANT]
> All unreleased changes are planned for the next major release, except for those that remained experimental.

## [Unreleased]

### Breaking Changes

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6525 -->

- The generated `app.commerce.config.js`, `app.commerce.manifest.json`, and `configuration-schema.json` compatibility artifacts will be removed, and `#app.commerce.config` will resolve to the root source config for every config format. After the change, importers will receive the input model and must validate it before using it. **Replacement:** import the root `app.commerce.config.*` file as the single source of truth.

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6337 -->

- The `PUT /config` action endpoint is removed. It overwrote all values for the scope and did not support partial updates or unset semantics, which could cause data loss when callers only intended to update a subset of config keys. **Replacement:** use `PATCH /config`, which updates only the provided fields and unsets a key when its value is `null`.

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6556 -->

- The `@adobe/aio-commerce-lib-app/management` entry point is removed in full. Every lifecycle operation is driven through the app management action instead of by importing and calling the engine in process. This removes the step tree and its `install`/`uninstall`/`validate` handlers, the workflow runners, the installation root step, the lifecycle planning and execution helpers, the workflow state predicates, and the installation-branded type aliases. **Replacement:** call the app management routes and read their responses: `POST /` to install or upgrade, `POST /validation` to validate, `POST /uninstallation` to uninstall, and `GET /` for status.
  - Exception: `defineCustomInstallationStep` and its `CustomInstallationStepDefinition` and `CustomInstallationStepHandler` types move to `@adobe/aio-commerce-lib-app/config`, next to `defineConfig`.

### Deprecated

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6556 -->

- The installation and uninstallation runners, their option and hook types, and the `install`/`uninstall` handlers on leaf steps now carry `@deprecated`. The rest of the entry point is tagged as each replacement lands.

## Released

### [1.8.0]

- `adminUiSdk` config key and `commerce/backend-ui/1` extension point support removed. The generated registration action (`src/commerce-backend-ui-1/.generated/actions/registration/index.js`) and its `pre-app-build` hook are no longer produced. **Replacement:** use `adminUi` and `commerce/backend-ui/2` — see the updated `usage.md`.
- `buildAdminUiSdkExtConfig()` removed from the public API.
- Types removed from the public API: `AdminUiSdkConfiguration`, `AdminUiSdkGridColumns`, `AdminUiSdkRegistration`, `AppConfigWithAdminUiSdk`, `BannerNotification`, `CustomerMassAction`, `CustomFee`, `MenuItem`, `OrderMassAction`, `OrderViewButton`, `ProductMassAction`.
- `hasAdminUiSdk()` removed from the public API.
- `GET /registration` endpoint removed from the app-config runtime action.
