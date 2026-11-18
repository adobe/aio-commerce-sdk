---
"@adobe/aio-commerce-lib-config": minor
---

Add a read-only business configuration audit showing changed fields, non-sensitive before/after values, and application-supplied actor metadata.

Sensitive values are redacted before audit persistence. Audit storage failures are reported explicitly when live configuration has already been saved.
