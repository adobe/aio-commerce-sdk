---
"@adobe/aio-commerce-lib-admin-ui": patch
---

Fix the order, invoice and credit memo view button request parsers rejecting real Commerce requests: map the `buttonId` body field to `id` and the `X-Request-ID` header to `requestId`.
