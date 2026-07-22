---
"@adobe/aio-commerce-lib-app": patch
---

For static business configs, the `#app.commerce.config` alias now resolves to a generated ESM module that re-exports the app manifest, so generated runtime actions can import it directly without needing a JSON import attribute.
