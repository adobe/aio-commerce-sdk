---
"@adobe/aio-commerce-lib-app": patch
---

Reject Admin UI ids that would map to the same Commerce permission. Conflicting grid column, mass action, order view button, or custom ACL resource ids now fail config validation instead of silently overwriting one another.
