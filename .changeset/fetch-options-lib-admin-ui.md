---
"@adobe/aio-commerce-lib-admin-ui": minor
---

The optional `fetchOptions` parameter on the Admin UI API functions is now typed with `FetchOptions` from `@adobe/aio-commerce-lib-api`, giving you a stable, SDK-owned type to import. Existing call sites that pass plain option objects are unaffected.
