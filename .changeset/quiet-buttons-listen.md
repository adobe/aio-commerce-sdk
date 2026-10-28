---
"@adobe/aio-commerce-lib-admin-ui": patch
"@adobe/aio-commerce-plugin-app-management": patch
---

Fix order, invoice and credit memo view-button worker parsers rejecting real Commerce requests: map the `buttonId` body field to `id` and the `X-Request-ID` header (`__ow_headers["x-request-id"]`) to `requestId`.
