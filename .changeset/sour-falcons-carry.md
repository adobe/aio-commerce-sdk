---
"@adobe/aio-commerce-lib-app": minor
---

Admin UI SDK mass actions v2: author mass actions under `adminUi` with an explicit `type: "view" | "worker"`, inlined `notifications`, a `runtimeAction` reference for worker actions, and a unified `selectionLimit`. Generation now targets `commerce/backend-ui/2` and the `adminUi` block is served through the app config action.

Mass actions now use `actionId` (full value, e.g. `"my-app::export-orders"`) instead of `id` — no transformation is applied by the SDK. Worker mass action `runtimeAction` entries are automatically generated as `workerProcess` operations in the `commerce/backend-ui/2` ext.config.yaml.
