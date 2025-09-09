# `createCustomCommerceEventsApiClient()`

```ts
function createCustomCommerceEventsApiClient<TFunctions>(
  params: CommerceHttpClientParams,
  functions: TFunctions,
): ApiClientRecord<AdobeCommerceHttpClient, TFunctions>;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/lib/api-client.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/db09d0de34ee085849efca6e0213ea525d0165dc/packages/aio-commerce-lib-events/source/commerce/lib/api-client.ts#L48)

Creates a customized Commerce Events API client.

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TFunctions` _extends_ `Record`\<`string`, `ApiFunction`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `any`[], `any`\>\> |

## Parameters

| Parameter   | Type                       | Description                                                                                          |
| ----------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `params`    | `CommerceHttpClientParams` | The parameters to build the Commerce HTTP client that will communicate with the Commerce Events API. |
| `functions` | `TFunctions`               | The API functions to include in the client.                                                          |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `TFunctions`\>
