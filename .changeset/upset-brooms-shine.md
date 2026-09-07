---
"@adobe/aio-commerce-lib-app": minor
---

Add support for declaring custom ACL resources under `adminUi.acl` (flat leaves or one-level groups) that are injected into the Commerce User Roles tree for app-checked permissions. An app declaring only ACL resources does not register a `commerce/backend-ui/2` extension point (in `app.config.yaml`, `install.yaml`, or generated ext.config), since ACL resources reach Commerce through the app-config payload.
