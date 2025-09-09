# `createAdobeIoEventsApiClient()`

```ts
function createAdobeIoEventsApiClient(params: IoEventsHttpClientParams): ApiClientRecord<AdobeIoEventsHttpClient, {
  create3rdPartyCustomEventProvider: ;
  createCommerceEventProvider: ;
  createEventMetadataForProvider: ;
  createEventProvider: ;
  getAll3rdPartyCustomEventProviders: ;
  getAllCommerceEventProviders: ;
  getAllEventMetadataForProvider: ;
  getAllEventProviders: ;
  getEventMetadataForEventAndProvider: ;
  getEventProviderById: ;
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts#L19)

Creates a new API client for the Adobe I/O Events API client.

## Parameters

| Parameter | Type                       | Description                                                                                                   |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `params`  | `IoEventsHttpClientParams` | The parameters to build the Adobe I/O Events HTTP client that will communicate with the Adobe I/O Events API. |

## Returns

`ApiClientRecord`\<[`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md), \{
`create3rdPartyCustomEventProvider`: ;
`createCommerceEventProvider`: ;
`createEventMetadataForProvider`: ;
`createEventProvider`: ;
`getAll3rdPartyCustomEventProviders`: ;
`getAllCommerceEventProviders`: ;
`getAllEventMetadataForProvider`: ;
`getAllEventProviders`: ;
`getEventMetadataForEventAndProvider`: ;
`getEventProviderById`: ;
\}\>
