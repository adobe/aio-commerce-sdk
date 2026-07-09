---
"@adobe/aio-commerce-lib-webhooks": minor
---

Add `isWebhookSuccessful()` to `@adobe/aio-commerce-lib-webhooks/responses` to determine whether a webhook action's result is successful, useful for tools that instrument actions generically (e.g. tracing libraries) and can't rely on the HTTP status code alone.
