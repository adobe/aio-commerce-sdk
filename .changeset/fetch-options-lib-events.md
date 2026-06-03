---
"@adobe/aio-commerce-lib-events": minor
---

The optional `fetchOptions` parameter on the Commerce and I/O Events API functions is now typed with `FetchOptions` from `@adobe/aio-commerce-lib-api` instead of `ky`'s `Options`. Existing call sites that pass plain option objects are unaffected.
