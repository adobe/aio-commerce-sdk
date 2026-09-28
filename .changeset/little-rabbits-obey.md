---
"@adobe/aio-commerce-lib-app": patch
---

Fix the generated `association` and `installation` runtime actions declaring `LOG_LEVEL` twice, once at the package level and once at the action level.
