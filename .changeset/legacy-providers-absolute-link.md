---
"@adobe/aio-commerce-lib-app": patch
---

Fix the uninstall and the upgrade of an app installed with `@adobe/aio-commerce-lib-app` 1.0.x or 1.1.0. Those versions do not put the workspace in the event provider's instance id, so the plan reads the workspace from the provider's `rel:update` link. The Adobe I/O Events API returns that link as an absolute URL, and the plan only understood a relative path. It read no workspace and stopped with `EVENTS_PROVIDER_IN_OTHER_WORKSPACE`. It now reads the workspace from the path of either form. A provider with no link, or with a link that is not a provider path, still stops the plan, and a provider of another workspace is still left alone.
