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

Defined in: [packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts#L31)

Creates a new API client for the Adobe I/O Events API client.

## Parameters

| Parameter | Type                       | Description                                                                                                   |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `params`  | `IoEventsHttpClientParams` | The parameters to build the Adobe I/O Events HTTP client that will communicate with the Adobe I/O Events API. |

## Returns

`ApiClientRecord`\<[`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md), \{
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
