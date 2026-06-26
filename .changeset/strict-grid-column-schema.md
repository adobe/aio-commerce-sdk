---
"@adobe/aio-commerce-lib-app": patch
---

Grid column entries in `adminUi` config now reject unknown keys (strict validation), so a mistyped field such as `aclprotected` surfaces a validation error instead of being silently dropped — matching the existing behavior of mass actions and view buttons.
