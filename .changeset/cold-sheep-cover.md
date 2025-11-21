---
"@adobe/aio-commerce-lib-config": patch
---

Configuration values of type `list` now require a `selectionMode` to be defined an no longer default to `single`. This is required because the `default` value for both of them are different (one is a simple string, the other a string array) and we need to discriminate against the `selectionMode` for type-safety.
