---
"@adobe/aio-commerce-lib-app": minor
---

Trace failed lifecycle operations. `GET /installation?history=true` returns every earlier attempt and the plans each one ran or replaced, with an optional `limit`. Attempt statuses now include the OpenWhisk activations that started and executed them and, once an attempt succeeds, the snapshot and app version it left installed. Steps record when they started and completed, the default logs show each lifecycle transition with its ids, and the `post-app-deploy` hook prints the attempt and activation ids when an automatic upgrade fails.
