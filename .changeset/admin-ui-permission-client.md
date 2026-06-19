---
"@adobe/aio-commerce-lib-admin-ui": minor
---

Add `getAdminUiPermissionClient` for checking ACL permissions at runtime (SPA bootstrap and runtime action entry). Includes in-process TTL cache, in-flight request deduplication, and deny-by-default on errors. Also exports `getAclResourceId` for deterministic ACL resource id derivation from `metadata.id`.
