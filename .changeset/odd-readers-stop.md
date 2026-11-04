---
"@adobe/aio-commerce-lib-app": minor
---

Trace failed lifecycle operations. `GET /installation?history=true` returns every earlier attempt and the plans each one ran or replaced, with an optional `limit`. `attemptId` reads one attempt, and `operation` (`install`, `upgrade` or `uninstall`) reads only the attempts of that operation, with `204` when none ran it. Attempt statuses now include the OpenWhisk activations that started and executed them and, once an attempt succeeds, the snapshot and app version it left installed. Steps record when they started and completed, the default logs show each lifecycle transition with its ids, and the `post-app-deploy` hook prints the run id and the execution activation id when an automatic upgrade fails.
