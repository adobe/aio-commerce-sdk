---
"@adobe/aio-commerce-lib-app": minor
---

Reconcile Commerce event subscription configuration changes during an app upgrade. When an event that exists in both the installed baseline and the target config changes its fields, rules, priority or HIPAA flag, the upgrade now updates the live subscription instead of leaving it stale.
