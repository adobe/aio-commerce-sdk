# Breaking Changes

> [!IMPORTANT]
> All unreleased changes are planned for the next major release, except for those that remained experimental.

## [Unreleased]

### Breaking Changes

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6525 -->

- The generated `app.commerce.config.js`, `app.commerce.manifest.json`, and `configuration-schema.json` compatibility artifacts will be removed, and `#app.commerce.config` will resolve to the root source config for every config format. After the change, importers will receive the input model and must validate it before using it. **Replacement:** import the root `app.commerce.config.*` file as the single source of truth.

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6527 -->

- The step-authoring surface will converge every lifecycle onto the resource-reconciliation capability: the `install`/`uninstall`/`validate` handlers on `LeafStep` will be expressed through `plan`/`apply` (installation becomes a plan of `add` operations against an empty baseline; uninstallation a plan of `remove` operations), and `LifecyclePlan.source`/`target` will become nullable to model first-install (no source snapshot) and uninstall (no target). **Replacement:** author steps with `plan`/`apply` once the runtime lands; the current `install`/`uninstall`/`validate` handlers remain until the major.

### Deprecated

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6337 -->

- `PUT /config` action endpoint will be removed in a future major — use `PATCH /config` instead. The PUT endpoint overwrites all values for the scope and does not support partial updates or unset semantics.

<!-- Internal tracking: https://jira.corp.adobe.com/browse/CEXT-6527 -->

- The workflow engine was generalized to lifecycle-neutral names so it can be shared across lifecycle modules (installation, upgrade). The following installation-branded types are now `@deprecated` aliases and will be removed in a future major — migrate to their lifecycle-neutral replacements from `@adobe/aio-commerce-lib-app/management`:
  - `InstallationContext` → `LifecycleContext`
  - `InstallationData` → `WorkflowData`
  - `InstallationError` → `WorkflowError`
  - `InstallationStatus` → `ExecutionStatus`
  - `InstallationState` → `WorkflowRunState`
  - `InProgressInstallationState` → `InProgressWorkflowState`
  - `SucceededInstallationState` → `SucceededWorkflowState`
  - `FailedInstallationState` → `FailedWorkflowState`
  - `InstallationRetryMetadata` → `WorkflowStateMetadata`

## Released

### [1.8.0]

- `adminUiSdk` config key and `commerce/backend-ui/1` extension point support removed. The generated registration action (`src/commerce-backend-ui-1/.generated/actions/registration/index.js`) and its `pre-app-build` hook are no longer produced. **Replacement:** use `adminUi` and `commerce/backend-ui/2` — see the updated `usage.md`.
- `buildAdminUiSdkExtConfig()` removed from the public API.
- Types removed from the public API: `AdminUiSdkConfiguration`, `AdminUiSdkGridColumns`, `AdminUiSdkRegistration`, `AppConfigWithAdminUiSdk`, `BannerNotification`, `CustomerMassAction`, `CustomFee`, `MenuItem`, `OrderMassAction`, `OrderViewButton`, `ProductMassAction`.
- `hasAdminUiSdk()` removed from the public API.
- `GET /registration` endpoint removed from the app-config runtime action.
