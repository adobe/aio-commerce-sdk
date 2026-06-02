---
"@adobe/aio-commerce-lib-app": patch
---

Fix `scopes` body validation in the scope tree action to use the proper recursive `CustomScopeInput` schema instead of `v.any()`.
