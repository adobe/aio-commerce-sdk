---
"@adobe/aio-commerce-lib-app": minor
---

Reconcile Commerce event subscription configuration changes during an app upgrade. When an event that exists in both the installed baseline and the target config changes its fields, rules, priority or HIPAA flag, the upgrade now updates the live subscription instead of leaving it stale: additive and same-key changes are applied in place, while changes that remove or re-key a field or rule are applied by re-subscribing the event.
