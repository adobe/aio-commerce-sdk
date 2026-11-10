---
"@adobe/aio-commerce-lib-app": patch
---

Fix the uninstall of an app that was installed before the `association` action existed. It stopped working in 2.1.0 and answered `409 not-associated`. The uninstall now plans with the Commerce instance sent with the request and, when it starts, stores that instance as the app's association record.
