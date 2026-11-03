---
"@adobe/aio-commerce-lib-app": patch
---

Upgrades now fix event providers, event metadata, registrations and Commerce subscriptions that a failed upgrade or a manual edit left missing, different or no longer declared. Provider and event label or description changes are now applied too. Commerce events keep their configured label and description in Adobe I/O Events after they are subscribed. An upgrade now stops with an issue instead of taking over a Commerce subscription that belongs to another provider.
