---
"@adobe/aio-commerce-lib-api": minor
---

Add a `FetchOptions` type and re-export `HTTPError` from the package entrypoint. Use these to type HTTP client request options and detect HTTP errors with stable SDK imports, without importing from `ky` directly.
