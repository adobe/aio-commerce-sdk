---
"@adobe/aio-commerce-lib-app": minor
---

Add helpers to retrieve the Commerce instance an app is associated with from any runtime action: `getCommerceInstance()` returns the stored instance data, and `getCommerceClient(auth)` returns a ready-to-use Commerce HTTP client built from that instance. Pass auth resolved with `resolveAuthParams` from `@adobe/aio-commerce-lib-auth`; the base URL and deployment type come from the stored association.
