---
"@adobe/aio-commerce-lib-config": patch
---

Fix an issue where the configured cache was not being set when caching values in `@adobe/aio-lib-state`. Also, correct an annotation that was mistakenly affirming that the cache timeout needs to be specified in milliseconds, while it must be in seconds.
