---
"@adobe/aio-commerce-lib-app": patch
---

Fix the Admin UI SDK installation step timing out by raising the Commerce HTTP client timeout to 2 minutes, matching the events and webhooks installation steps.
