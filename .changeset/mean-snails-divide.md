---
"@adobe/aio-commerce-lib-auth": patch
---

The IMS authentication schema has been updated to support both `string` and `string[]` inputs, automatically handling cases where you might have a single secret string, given in a non-array format (which is the expected).
