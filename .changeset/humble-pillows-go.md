---
"@adobe/aio-commerce-lib-app": minor
---

Add the SDK reconcile engine and update-preview/update action routes. `POST /update` now rejects a plan containing an unsupported change (a Commerce subscription/webhook, or an I/O Events provider/metadata change) with a 409 response before applying anything, instead of partially applying the plan and failing mid-reconcile.
