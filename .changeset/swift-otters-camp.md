---
"@adobe/aio-commerce-lib-webhooks": patch
---

Fix the webhook exception operation to emit the exception class under the `type` field instead of `class`, matching the Adobe Commerce webhook response spec. Previously the supplied exception class was ignored by Commerce.
