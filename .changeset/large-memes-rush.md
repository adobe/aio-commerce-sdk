---
"@adobe/aio-commerce-lib-config": patch
---

Fix an issue with the CLI commands were the `process.cwd` was not correctly being used as a fallback when the project root dir was not found.
