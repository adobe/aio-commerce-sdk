---
"@adobe/aio-commerce-lib-app": minor
---

Uninstallation now removes exactly the resources that were created at install time, even when the app configuration has since changed. Installs created before this change fall back to the current request config. The installation/uninstallation status responses now include an optional `config` field recording what was applied.
