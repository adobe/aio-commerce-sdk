---
"@adobe/aio-commerce-lib-app": minor
---

Reconcile custom installation steps during upgrades. A step's `install` runs the first time its name appears in the configuration and is never re-run afterward, so editing a step's script in place has no effect on upgrade; add a new step to run new logic. Removing a step from the configuration no longer runs its `uninstall` during the upgrade; every step that ever ran, whether or not it's still configured, gets its `uninstall` called when the app is fully uninstalled.
