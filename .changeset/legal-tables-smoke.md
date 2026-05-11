---
"@adobe/aio-commerce-lib-app": patch
---

Installation now retries once on failure. If the retry succeeds, the result includes `isRetry: true`.
