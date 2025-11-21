---
"@adobe/aio-commerce-lib-config": patch
---

Remove all logging in CLI commands made via `@adobe/aio-lib-core-logging`. Instead use `process.stdout` and `process.stderr` for better readability of log messages.
