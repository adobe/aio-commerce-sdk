---
"@adobe/aio-commerce-lib-config": patch
---

The `sync-commerce-scopes` now returns a 203 status code if the scope data comes from the cache, together with an `x-cache: hit` custom header. If there's an error in the request, a 500 status code is returned.
