---
"@adobe/aio-commerce-lib-app": patch
---

Install, upgrade and uninstall finish faster, because eventing, webhooks and Admin UI no longer wait for each other. If one of them fails, the others still complete instead of being skipped. Custom installation steps still run only after all three succeed, so they can rely on what those steps create.
