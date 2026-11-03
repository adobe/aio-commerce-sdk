---
"@adobe/aio-commerce-lib-app": patch
---

The installation action no longer reads the `x-aio-commerce-installation-invocation-source` header. `GET /` with no lifecycle attempt and no `operation` now always falls back to the legacy installation record, and the OpenAPI document no longer lists the header.
