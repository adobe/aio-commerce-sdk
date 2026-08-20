---
"@adobe/aio-commerce-lib-app": patch
---

Enforce unique ids within Admin UI `massActions` and `viewButtons` arrays at the config schema level. Duplicate ids in these arrays are now rejected during validation, matching Commerce's own constraint.
