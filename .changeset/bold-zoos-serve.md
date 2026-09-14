---
"@adobe/aio-commerce-lib-app": patch
---

`metadata.upgradeMode` temporarily defaults to `"manual"` instead of `"auto"` while automatic upgrade execution is stabilized. Set `upgradeMode: "auto"` explicitly to keep the previous behavior.
