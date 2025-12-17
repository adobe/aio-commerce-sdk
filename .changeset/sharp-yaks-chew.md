---
"@adobe/aio-commerce-lib-config": patch
---

Fixes a bug within the `init` script, where `import` was always used in the template of `extensibility.config.js` and it doesn't work on non-ESM projects.
