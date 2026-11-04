---
"@adobe/aio-commerce-lib-app": patch
---

Each custom installation step now runs as its own step, with its own progress during installs, upgrades and uninstalls. Retrying a failed operation no longer runs again the custom installation steps that already succeeded. An upgrade that removes a custom installation step now warns that its uninstall can't run, since its script is no longer deployed.
