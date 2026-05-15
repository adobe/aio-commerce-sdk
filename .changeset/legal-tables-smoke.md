---
"@adobe/aio-commerce-lib-app": patch
---

Installation now retries once on failure. The retry resumes from the failed step, preserving progress from the first attempt. When a retry was attempted, the final state (whether succeeded or failed) includes `metadata: { isRetry: true }`.
