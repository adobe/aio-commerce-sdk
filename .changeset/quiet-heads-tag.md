---
"@adobe/aio-commerce-lib-app": patch
---

Add an `x-ac-sdk-lib-versions` response header to every app-management endpoint response. It lists the lib-app version and the installed lib-config version it loads (not the app's version), for example `lib-app="2.2.0", lib-config="1.4.1"`.
