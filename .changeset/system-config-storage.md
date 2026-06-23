---
"@adobe/aio-commerce-lib-config": minor
---

Add `getSystemConfigByKey` and `setSystemConfigByKey` to store and retrieve generic SDK system configuration under a dedicated `system.*` namespace. Both accept an optional `ttlSeconds` argument to control the cache lifetime (defaults to 24 hours).
