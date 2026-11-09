---
"@adobe/aio-commerce-lib-config": minor
---

Add durable, redacted configuration history and audit verification, with read-only version comparisons, retention, and archive management.

Configuration updates now include version metadata. History failures are reported explicitly even when live configuration was already saved; serialize writes to each scope and inspect live values before retrying such errors.
