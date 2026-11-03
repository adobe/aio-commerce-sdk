---
"@adobe/aio-commerce-lib-app": patch
---

Uninstalling an app that only has business configuration no longer warns that there is no record of what was installed. Such an app has nothing to install, so no record is ever written and the warning does not apply.
