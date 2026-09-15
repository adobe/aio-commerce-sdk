---
"@adobe/aio-commerce-lib-app": patch
---

Upgrades now recover safely when Commerce rejects a webhook or event change. A rejected replacement restores the entity it would have replaced, and a rejected addition rolls back everything else added during that same upgrade, instead of leaving Commerce in a broken, partially-applied state.
