---
"@adobe/aio-commerce-lib-app": patch
---

Deprecates the pre-lifecycle installation engine (`runInstallation`, `runUninstallation`, `runValidation` and their helpers) ahead of its removal in the next major. Drive installs and uninstalls through the installation runtime action instead. An installed app's lifecycle baseline is now migrated once from the legacy installation record rather than re-read on every request, so a lifecycle snapshot keeps resolving after that record is gone.
