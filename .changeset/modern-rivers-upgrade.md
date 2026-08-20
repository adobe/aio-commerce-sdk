---
"@adobe/aio-commerce-lib-app": minor
---

Add post-deployment upgrade planning with automatic execution that waits for the result and a manual plan-only mode. `POST /installation` is now a desired-state endpoint: with no baseline it installs, otherwise it upgrades toward `metadata.version` and reports the chosen `operation` in the response.
