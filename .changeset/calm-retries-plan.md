---
"@adobe/aio-commerce-lib-app": patch
---

Retrying a failed upgrade now plans again from the current state instead of resuming from where the failed attempt stopped. Each planned operation now has a `reason`: `change` when the new configuration causes it, `drift` when only the deployed state differs from the configuration.
