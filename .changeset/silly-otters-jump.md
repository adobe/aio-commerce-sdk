---
"@adobe/aio-commerce-lib-app": patch
---

Fix webhook upgrade planning to track removals as possible cleanup resources, just like additions already were, and to no longer treat a desired webhook as "retained" when its identity has a pending unresolved cleanup entry. Previously, a webhook removal that succeeded against Commerce but wasn't recorded due to a later failure in the same attempt could be silently left unsubscribed, since the next plan would trust the stale baseline and skip re-adding it.
