---
"@adobe/aio-commerce-lib-app": minor
---

New `getQualifiedEventCode(eventName, providerType)` export that resolves an event declared in `app.commerce.config.ts` to the fully-qualified I/O Events code it is registered under, so runtime actions can match incoming events without hardcoding the prefix.
