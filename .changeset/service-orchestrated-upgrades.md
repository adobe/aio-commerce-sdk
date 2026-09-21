---
"@adobe/aio-commerce-lib-app": minor
---

App upgrades are now driven by the Commerce App Management Service. On deploy, the app notifies the service that a new version is available and the service performs and tracks the upgrade. Set `metadata.upgradeMode` to `auto` to upgrade on deploy, or `manual` to let the merchant start it from the Commerce App Management UI.
