---
"@adobe/aio-commerce-lib-app": patch
---

The upgrade commands now send the extension's Commerce instance with every upgrade request so the service can authorize access to it, and retry upgrade status checks that fail with a 503.
