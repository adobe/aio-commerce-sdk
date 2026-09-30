---
"@adobe/aio-commerce-lib-config": patch
---

Invalidate the configuration cache in every `aio-lib-state` region when a config value changes, preventing stale reads from action instances routed to a different region than the one that made the change.
