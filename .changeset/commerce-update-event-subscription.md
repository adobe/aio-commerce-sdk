---
"@adobe/aio-commerce-lib-events": minor
---

Add `updateEventSubscription` to the Commerce Events API client, wrapping the `PUT eventing/eventSubscribe/:name` endpoint to update an existing subscription's fields and rules in place. The endpoint merges by key and cannot remove entries.
