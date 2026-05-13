---
"@adobe/aio-commerce-lib-config": minor
"@adobe/aio-commerce-lib-app": minor
---

Add optional `env` property on configuration schema fields to scope them to specific Commerce environments (`"paas"`, `"saas"`). The config runtime action accepts a `commerceEnv` query parameter to filter the returned schema to fields applicable to the requested environment; fields without `env` apply to all environments.
