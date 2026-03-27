---
"@adobe/aio-commerce-lib-config": minor
---

Schema management has been refactored to use a simple in-memory global state instead of persisting schemas to files and caching them. The `initialize()` function must now be called with a schema before using configuration functions. Previously, schemas were persisted to files and could be reused across restarts, making initialization optional.
