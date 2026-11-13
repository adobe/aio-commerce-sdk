---
"@adobe/aio-commerce-lib-app": patch
---

Fix `publishEvent` using a stale or missing provider after an app is uninstalled and reinstalled. The uninstall now removes the stored event data of a provider that was already deleted, and lists the removal in the plan. If it fails, the uninstall fails and can be retried. An install or upgrade that removes a duplicate provider no longer deletes the stored data of the provider it keeps.
