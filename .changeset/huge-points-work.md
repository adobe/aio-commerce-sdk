---
"@adobe/aio-commerce-lib-app": patch
---

Several issues fixed:

- An upgrade request that runs into another one in progress, or whose plan another request replaced, now gets a `409` with reason `in-progress` or `stale-plan` instead of a `500`.

- An upgrade that cannot start, for example because the app was deployed again after planning, is recorded as failed right away instead of blocking new upgrades until its deadline.

- A request whose stored upgrade state cannot be read now gets a `409` with reason `unreadable-state` instead of installing the app again.

- When saving installation or upgrade state fails, the cached copy no longer keeps the unsaved value.
