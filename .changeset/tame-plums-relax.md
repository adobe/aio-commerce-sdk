---
"@adobe/aio-commerce-lib-app": patch
---

Fix webhook upgrade planning to block instead of silently skipping removals when a prior baseline exists but its subscribed-webhooks data could not be resolved. Previously this case was treated the same as "no prior state", which could leave stale webhooks subscribed in Commerce with no plan to remove them.
