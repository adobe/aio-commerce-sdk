---
"@adobe/aio-commerce-lib-config": patch
---

Clear cached configuration in every `aio-lib-state` region that is available, so a region that cannot be initialized (such as any region but `amer` on stage) no longer leaves stale entries behind. Clearing a config entry, including `setSystemConfigByKey(key, null)`, now throws when a region's cached entry cannot be removed, instead of logging at debug level and succeeding. Writes still succeed and log a warning.
