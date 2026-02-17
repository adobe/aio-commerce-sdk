# `getAllEventProviders()`

```ts
function getAllEventProviders(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    consumerOrgId: string;
    filterBy?: {
      instanceId?: string;
      providerTypes?: ("dx_commerce_events" | "3rd_party_custom_events")[];
    };
    withEventMetadata?: boolean;
  },
  fetchOptions?: Options,
): Promise<IoEventProviderManyResponse>;
```

Defined in: [io-events/api/event-providers/endpoints.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts#L44)

Lists all event providers for the given consumer organization ID.

## Parameters

| Parameter                        | Type                                                                                                                                                                                        | Description                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                     | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)                        | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                         | \{ `consumerOrgId`: `string`; `filterBy?`: \{ `instanceId?`: `string`; `providerTypes?`: (`"dx_commerce_events"` \| `"3rd_party_custom_events"`)[]; \}; `withEventMetadata?`: `boolean`; \} | The parameters to list the event providers with.                                                                                                                                                   |
| `params.consumerOrgId`           | `string`                                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.filterBy?`               | \{ `instanceId?`: `string`; `providerTypes?`: (`"dx_commerce_events"` \| `"3rd_party_custom_events"`)[]; \}                                                                                 | -                                                                                                                                                                                                  |
| `params.filterBy.instanceId?`    | `string`                                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.filterBy.providerTypes?` | (`"dx_commerce_events"` \| `"3rd_party_custom_events"`)[]                                                                                                                                   | -                                                                                                                                                                                                  |
| `params.withEventMetadata?`      | `boolean`                                                                                                                                                                                   | -                                                                                                                                                                                                  |
| `fetchOptions?`                  | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                  | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<[`IoEventProviderManyResponse`](../type-aliases/IoEventProviderManyResponse.md)\>

## See

https://developer.adobe.com/events/docs/api#operation/getProvidersByConsumerOrgId
