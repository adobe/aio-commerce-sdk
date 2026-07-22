---
"@adobe/aio-commerce-lib-auth": patch
---

Fix Commerce integration (OAuth 1.0a) request signing for URLs with array-style query parameters (e.g. `searchCriteria[...]`). This caused Adobe Commerce to reject affected requests with "The signature is invalid."
