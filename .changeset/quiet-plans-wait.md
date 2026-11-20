---
"@adobe/aio-commerce-lib-app": minor
---

Return the `upgradeMode` of the target config in upgrade plan previews, so App Management can tell an automatic upgrade from a manual one.

Report clearly in the `post-app-deploy` hook when another upgrade of the app is in progress or an automatic upgrade is pending.
