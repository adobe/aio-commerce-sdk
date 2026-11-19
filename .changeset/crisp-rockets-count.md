---
"@adobe/aio-commerce-lib-app": minor
---

Validate `runtimeAction` and `runtimeActions` references at build time. The `pre-app-build` hook now fails when a referenced action is not declared in the app, when its `function` file is missing, when an `adminUi` action is not declared in the `commerce/backend-ui/2` extension, or when a webhook action is not a web action. Webhook `runtimeAction` values must use the `<package>/<action>` format, and event `runtimeActions` now accept every character OpenWhisk allows in package and action names, such as `_` and `.`.
