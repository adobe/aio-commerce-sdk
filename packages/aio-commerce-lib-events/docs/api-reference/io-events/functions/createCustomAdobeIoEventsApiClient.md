# `createCustomAdobeIoEventsApiClient()`

```ts
function createCustomAdobeIoEventsApiClient<
  TFunctions extends Record<
    string,
    ApiFunction<AdobeIoEventsHttpClient, any[], any>
  >,
>(
  params: IoEventsHttpClientParams,
  functions: TFunctions,
): ApiClientRecord<AdobeIoEventsHttpClient, TFunctions>;
```

Defined in: [io-events/lib/api-client.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-events/source/io-events/lib/api-client.ts#L58)

Creates a customized Adobe I/O Events API client.

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="type-parameter-tfunctions"></a> `TFunctions` _extends_ `Record`\<`string`, `ApiFunction`\<[`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md), `any`[], `any`\>\> |

## Parameters

| Parameter   | Type                       | Description                                                                                                   |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `params`    | `IoEventsHttpClientParams` | The parameters to build the Adobe I/O Events HTTP client that will communicate with the Adobe I/O Events API. |
| `functions` | `TFunctions`               | The API functions to include in the client.                                                                   |

## Returns

`ApiClientRecord`\<[`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md), `TFunctions`\>
