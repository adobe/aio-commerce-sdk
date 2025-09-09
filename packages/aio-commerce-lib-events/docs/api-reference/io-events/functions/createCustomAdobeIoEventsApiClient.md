# `createCustomAdobeIoEventsApiClient()`

```ts
function createCustomAdobeIoEventsApiClient<TFunctions>(
  params: IoEventsHttpClientParams,
  functions: TFunctions,
): ApiClientRecord<AdobeIoEventsHttpClient, TFunctions>;
```

Defined in: [packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/db09d0de34ee085849efca6e0213ea525d0165dc/packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts#L46)

Creates a customized Adobe I/O Events API client.

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TFunctions` _extends_ `Record`\<`string`, `ApiFunction`\<[`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md), `any`[], `any`\>\> |

## Parameters

| Parameter   | Type                       | Description                                                                                                   |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `params`    | `IoEventsHttpClientParams` | The parameters to build the Adobe I/O Events HTTP client that will communicate with the Adobe I/O Events API. |
| `functions` | `TFunctions`               | The API functions to include in the client.                                                                   |

## Returns

`ApiClientRecord`\<[`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md), `TFunctions`\>
