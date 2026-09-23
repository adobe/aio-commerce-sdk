---
"@adobe/aio-commerce-lib-app": minor
---

The Commerce App Management Service now binds record ownership during association: the association runtime action returns the app's IMS client ID so the service can persist it as the record owner. Only the owning app can update its own record.
