---
"@adobe/aio-commerce-lib-config": minor
---

Add `dynamicList` field type for business configuration schemas. List options (and an optional `default`) can be supplied as factory functions that receive the runtime action params. New `resolveBusinessConfigSchema` and `hasDynamicSchema` helpers, and a new `ResolvedBusinessConfigSchema` type for the post-resolution shape.
