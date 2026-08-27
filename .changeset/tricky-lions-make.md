---
"@adobe/aio-commerce-lib-config": minor
---

Add a `RecordedSchemaBusinessConfig` schema (and matching `RecordedBusinessConfig` type) that accepts `dynamicList` fields recovered from storage without their `options`/`default` functions, since those cannot survive a JSON round trip.
