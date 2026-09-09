---
"@adobe/aio-commerce-lib-app": patch
---

Resolve the correct event provider during an upgrade when a duplicate provider exists in the org. Provider resolution now prefers the current workspace-scoped provider over a stale legacy (workspace-less) one, and prefers a provider that carries metadata over an empty duplicate — so an upgrade no longer fails with a 404 "no such event metadata" by targeting the wrong provider.
