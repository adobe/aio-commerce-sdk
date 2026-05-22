---
"@adobe/aio-commerce-lib-api": minor
"@adobe/aio-commerce-lib-events": minor
"@adobe/aio-commerce-lib-webhooks": minor
---

Upgrade ky to v2. Introduces `FetchOptions`, an SDK-owned type that replaces ky's `Options` in all public APIs. Hook signatures remain v1-compatible — existing `(request) => ...` hooks continue to work unchanged. The ky upgrade is now an internal implementation detail.
