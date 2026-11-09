---
"@adobe/aio-commerce-lib-config": minor
"@adobe/aio-commerce-lib-app": minor
"@adobe/aio-commerce-plugin-app-management": patch
---

Add durable, redacted configuration history and audit verification, with version comparisons, secret-preserving rollback, retention, and archive management.

Configuration updates now include version metadata. History failures are reported explicitly even when live configuration was already saved; serialize writes to each scope and inspect live values before retrying such errors.
