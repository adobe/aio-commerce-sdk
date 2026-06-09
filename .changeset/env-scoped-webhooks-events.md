---
"@adobe/aio-commerce-lib-app": minor
---

Webhooks and events now accept an optional `env` array (`"paas"` / `"saas"`) to scope them to specific Commerce environments. Items without `env` apply everywhere; scoped items are only installed on matching environments, and an event provider left with no applicable events is skipped entirely. The `app-config` action also accepts an optional `commerceEnv` query param that returns webhooks and events already filtered to that environment.
