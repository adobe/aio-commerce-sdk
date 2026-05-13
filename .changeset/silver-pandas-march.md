---
"@adobe/aio-commerce-lib-app": minor
---

The business configuration runtime action's `GET /` endpoint now accepts an optional `commerceEnv` query parameter (`"paas" | "saas"`). When provided, the returned schema is filtered to only include fields scoped to that environment via the `env` property. Fields without an `env` property are always included.
