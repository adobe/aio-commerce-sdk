---
"@adobe/aio-commerce-lib-app": minor
---

Add an optional `runtime` field to `app.commerce.config.*` that sets the Adobe I/O Runtime kind for every generated action. Accepts `nodejs:22` (default) or `nodejs:24`; use `nodejs:24` when actions need ESM with `require()` interop.
