---
"@adobe/aio-commerce-lib-app": patch
---

Commerce Eventing setup no longer sends empty technical account fields when your app authenticates with OAuth Server-to-Server credentials that don't have one, such as those provided via the `include-ims-credentials` annotation.
