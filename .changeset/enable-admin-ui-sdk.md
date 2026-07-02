---
"@adobe/aio-commerce-lib-admin-ui": minor
"@adobe/aio-commerce-lib-app": minor
---

Add `enableAdminUiSdk` to the Admin UI API client, which enables the Admin UI SDK in Commerce via `PUT /V1/adminuisdk/config`. The app installation flow now enables the SDK before registering the extension, so Admin UI extensions are served correctly after install.
