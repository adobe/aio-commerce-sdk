---
"@adobe/aio-commerce-lib-api": minor
---

Upgrade ky to v2. `unwrapHttpError` is now synchronous (returns `string` instead of `Promise<string>`); existing `await` call-sites continue to work unchanged.
