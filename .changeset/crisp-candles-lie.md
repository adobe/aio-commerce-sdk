---
"@adobe/aio-commerce-lib-api": minor
"@adobe/aio-commerce-lib-events": minor
"@adobe/aio-commerce-lib-app": minor
"@adobe/aio-commerce-sdk": minor
---

You can now publish a custom I/O Event from a runtime action by calling `publishEvent` from `@adobe/aio-commerce-lib-app`, passing the provider key and event name declared in `app.commerce.config.ts`. Provider IDs and event codes are resolved from metadata written to system storage at installation time — no management API round-trip at runtime. `@adobe/aio-commerce-lib-events` gains a `publishRawEvent` export for callers that supply the resolved provider ID and event code directly. `@adobe/aio-commerce-lib-api` gains an `ingressBaseUrl` option on `IoEventsHttpClientConfig` to target non-production ingress endpoints.
