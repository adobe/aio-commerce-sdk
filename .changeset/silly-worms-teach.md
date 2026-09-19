---
"@adobe/aio-commerce-lib-app": patch
---

Commerce Eventing setup now provides a default technical account when your app authenticates with OAuth Server-to-Server credentials that don't have one, such as those provided via the `include-ims-credentials` annotation, so Commerce can still consume the workspace configuration.
