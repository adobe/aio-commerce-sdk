---
"@adobe/aio-commerce-plugin-app-management": patch
---

Corrected how the eventing and storage skills document reading an action's incoming payload, so generated handlers read the right fields:

- Event handlers now read the event data from `params.data.value` (previously the skills pointed at `params.data`, which also holds delivery metadata and would leave every field undefined).
- Webhook handlers are now documented separately from events, since their payloads differ: the Commerce operation data arrives directly on `params` (for example `params.order`), and responses use the helpers from `@adobe/aio-commerce-lib-webhooks/responses`.
