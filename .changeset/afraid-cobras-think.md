---
"@adobe/aio-commerce-lib-app": minor
---

New `publishEvent` export for publishing a configured I/O Event from a runtime action by provider key and event name as declared in `app.commerce.config.ts`. Provider and event resolution happens automatically from metadata stored at installation time. Accepts an optional `hipaaAuditRequired` flag to mark events containing PHI data for HIPAA compliance.
