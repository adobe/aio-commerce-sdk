# @adobe/aio-commerce-lib-events

## 0.1.0

### Minor Changes

- [#72](https://github.com/adobe/aio-commerce-sdk/pull/72) [`31eb4e4`](https://github.com/adobe/aio-commerce-sdk/commit/31eb4e403f30b593aafff57dc268bf9e6cf49f3e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - - Introduce return types for API operations
  - Fixes some validation pipelines and wrongful API payloads.
  - Transform API responses to camel case.

- [#70](https://github.com/adobe/aio-commerce-sdk/pull/70) [`b2f7c2e`](https://github.com/adobe/aio-commerce-sdk/commit/b2f7c2efb46b54ba6819a19ead465f24b9f00de9) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Create library and introduce the following API operations:

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
