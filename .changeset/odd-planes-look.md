---
"@adobe/aio-commerce-lib-app": minor
---

Add `adminUi` config key for grid column extensions on `commerce/backend-ui/2`. Grid columns are now declared under `adminUi.{order,product,customer}.gridColumns` using `runtimeAction`, `columns` (with `key`), `label`, and `description`. The SDK generates `workerProcess` declarations in `ext.config.yaml` automatically from `runtimeAction` values. Grid columns are removed from the `adminUiSdk` v1 schema.
