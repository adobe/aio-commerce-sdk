---
"@adobe/aio-commerce-plugin-app-management": patch
---

Document in the `commerce-app-storage` skill that `findOne` throws a `DbError` on a no-match miss instead of resolving to `null`, and add guidance for distinguishing that case from a genuine failure.
