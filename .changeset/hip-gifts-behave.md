---
"@adobe/aio-commerce-lib-events": minor
---

Create library and introduce the following API operations:

**For Adobe I/O Events**:

| Category                    | Operations                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Event Providers             | `getAllEventProviders`, `getEventProviderById`, `createEventProvider`                                                                 |
| Event Providers (Shortcuts) | `getAllCommerceEventProviders`, `getAll3rdPartyCustomEventsProviders`, `createCommerceProvider`, `create3rdPartyCustomEventsProvider` |
| Event Metadata              | `getAllEventMetadataForProvider`, `getEventMetadataForEventAndProvider`, `createEventMetadataForProvider`                             |

**For Adobe Commerce**:

| Category               | Operations                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| Event Providers        | `getAllEventProviders`, `getEventProviderById`, `createEventProvider` |
| Event Subscriptions    | `getAllEventSubscriptions`, `createEventSubscription`                 |
| Eventing Configuration | `updateEventingConfiguration`                                         |
