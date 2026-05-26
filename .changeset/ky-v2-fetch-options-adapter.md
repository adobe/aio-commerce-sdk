---
"@adobe/aio-commerce-lib-api": minor
"@adobe/aio-commerce-lib-events": minor
"@adobe/aio-commerce-lib-webhooks": minor
---

Upgrade ky to v2. Introduces `FetchOptions`, an SDK-owned type that replaces ky's `Options` in all public APIs. Hook signatures use positional-argument form and expose all ky v2 state fields (`options: NormalizedOptions`, `retryCount`) — existing `(request) => ...` hooks continue to work unchanged. `HTTPError` is now exported from `@adobe/aio-commerce-lib-api` so consumers no longer need to import it directly from ky. The ky upgrade is now an internal implementation detail.
