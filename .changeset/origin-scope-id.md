---
"@adobe/aio-commerce-lib-config": minor
---

`ConfigOrigin` now includes a required `id` field carrying the scope's unique identifier. This allows consumers to unambiguously identify the source scope of inherited configuration values. Schema-default origins use the sentinel value `"default"` for this field.
