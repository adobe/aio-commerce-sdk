---
"@adobe/aio-commerce-lib-auth": patch
---

Fix Commerce integration (OAuth 1.0a) request signing for URLs with array-style query parameters (e.g. `searchCriteria[...]`). Query parameters are now decoded via `URLSearchParams` and signed as normalized parameters against the query-less base URI (RFC 5849 §3.4.1.2), instead of delegating URL parsing to `oauth-1.0a` — whose `deParam` does not decode parameter keys, leaving percent-encoded keys double-encoded in the signature base string. This caused Adobe Commerce to reject affected requests with "The signature is invalid."
