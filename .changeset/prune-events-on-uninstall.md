---
"@adobe/aio-commerce-lib-app": patch
---

Remove the stored event data of a provider that is already deleted when uninstalling. Before, it stayed behind, so `publishEvent` kept posting to a provider that no longer existed. The plan lists the removal as an operation. If it fails, the uninstall fails and can be retried.
