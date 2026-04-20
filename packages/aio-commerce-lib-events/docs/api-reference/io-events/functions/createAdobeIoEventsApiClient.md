# `createAdobeIoEventsApiClient()`

```ts
function createAdobeIoEventsApiClient(params: IoEventsHttpClientParams): ApiClientRecord<AdobeIoEventsHttpClient, {
  create3rdPartyCustomEventProvider: ;
  createCommerceEventProvider: ;
  createEventMetadataForProvider: ;
  createEventProvider: ;
  createRegistration: ;
  deleteEventMetadataForProvider: ;
  deleteEventProvider: ;
  deleteRegistration: ;
  getAll3rdPartyCustomEventProviders: ;
  getAllCommerceEventProviders: ;
  getAllEventMetadataForProvider: ;
  getAllEventProviders: ;
  getAllRegistrations: ;
  getAllRegistrationsByConsumerOrg: ;
  getEventMetadataForEventAndProvider: ;
  getEventProviderById: ;
  getRegistrationById: ;
  updateRegistration: ;
}>;
```

Defined in: [io-events/lib/api-client.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts#L32)

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
`createRegistration`: ;
`deleteEventMetadataForProvider`: ;
`deleteEventProvider`: ;
`deleteRegistration`: ;
`getAll3rdPartyCustomEventProviders`: ;
`getAllCommerceEventProviders`: ;
`getAllEventMetadataForProvider`: ;
`getAllEventProviders`: ;
`getAllRegistrations`: ;
`getAllRegistrationsByConsumerOrg`: ;
`getEventMetadataForEventAndProvider`: ;
`getEventProviderById`: ;
`getRegistrationById`: ;
`updateRegistration`: ;
\}\>
