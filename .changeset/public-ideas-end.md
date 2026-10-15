---
"@adobe/aio-commerce-lib-app": patch
---

Upgrades now create each missing event provider, event metadata, registration and Commerce subscription on its own, and stop at the first one that fails instead of reusing whatever already exists.
