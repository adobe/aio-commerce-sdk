---
"@adobe/aio-commerce-lib-app": patch
---

Keep the stored event data of a provider when an install or upgrade removes a duplicate provider that has the same instance id. Before, `publishEvent` failed with `ProviderNotFoundError` or `EventsDataNotInitializedError` after that.
