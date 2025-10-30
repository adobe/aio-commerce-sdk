# @adobe/aio-commerce-lib-events

## 0.3.1

### Patch Changes

- [#95](https://github.com/adobe/aio-commerce-sdk/pull/95) [`abd5012`](https://github.com/adobe/aio-commerce-sdk/commit/abd5012e5680f97abd150de6036b2225c7dc0277) Thanks [@renovate](https://github.com/apps/renovate)! - Fix automatic handling of expected Base64 format for `sample_event_template` during event metadata creation.

- Updated dependencies [[`abd5012`](https://github.com/adobe/aio-commerce-sdk/commit/abd5012e5680f97abd150de6036b2225c7dc0277)]:
  - @adobe/aio-commerce-lib-auth@0.5.0
  - @adobe/aio-commerce-lib-api@0.2.1

## 0.3.0

### Minor Changes

- [#97](https://github.com/adobe/aio-commerce-sdk/pull/97) [`4c2e0c4`](https://github.com/adobe/aio-commerce-sdk/commit/4c2e0c4699d64065853e648f5bba5b66acda08c3) Thanks [@aminakhyat](https://github.com/aminakhyat)! - Update `@adobe/aio-commerce-lib-events` with published `@adobe/aio-commerce-lib-api` dependency

### Patch Changes

- Updated dependencies [[`4c2e0c4`](https://github.com/adobe/aio-commerce-sdk/commit/4c2e0c4699d64065853e648f5bba5b66acda08c3)]:
  - @adobe/aio-commerce-lib-api@0.2.0

## 0.2.1

### Patch Changes

- [#88](https://github.com/adobe/aio-commerce-sdk/pull/88) [`db844b7`](https://github.com/adobe/aio-commerce-sdk/commit/db844b7c3685fa8d20cf865b88786a863c9fc963) Thanks [@jnatherley](https://github.com/jnatherley)! - Module resolution should work for `cjs` and `esm` for aio-commerce-lib-events. Fixed export mapping that led to unresolvable paths when using the package.

## 0.2.0

### Minor Changes

- [#85](https://github.com/adobe/aio-commerce-sdk/pull/85) [`cd6e4d7`](https://github.com/adobe/aio-commerce-sdk/commit/cd6e4d786c82e964808b402c84e124e1db621e9e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - All API functions are made explicitly asynchronous for consistent error handling via `Promise`. Fix type bugs with the factory functions used to instantiate new API clients.

### Patch Changes

- Updated dependencies [[`e0db24c`](https://github.com/adobe/aio-commerce-sdk/commit/e0db24c04aed9a6df72e80d5395aa41374570b6a)]:
  - @adobe/aio-commerce-lib-auth@0.4.0

## 0.1.0

### Minor Changes

- [#72](https://github.com/adobe/aio-commerce-sdk/pull/72) [`31eb4e4`](https://github.com/adobe/aio-commerce-sdk/commit/31eb4e403f30b593aafff57dc268bf9e6cf49f3e) Thanks [@iivvaannxx](https://github.com/iivvaannxx)! - Introduce return types for API operations, and transform API responses to `camelCase`. Fixes some validation pipelines and wrongful API payloads.

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
