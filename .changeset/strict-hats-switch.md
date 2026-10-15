---
"@adobe/aio-commerce-lib-app": minor
---

The `post-app-deploy` hook now plans and starts the upgrade through the Commerce App Management Service, and keeps following it in the background if you interrupt the hook. The new `upgrade status [run-id]` command checks an upgrade run later.
