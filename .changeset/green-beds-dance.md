---
"@adobe/aio-commerce-lib-app": minor
---

Add uninstallation flow for both native steps and custom steps. `defineCustomInstallationStep` now accepts an object with `install` and an optional `uninstall` handler in addition to a plain function, enabling per-step cleanup logic.
