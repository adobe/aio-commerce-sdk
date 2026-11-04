# `createCustomCommerceEventsApiClient()`

```ts
function createCustomCommerceEventsApiClient<
  TFunctions extends Record<
    string,
    ApiFunction<AdobeCommerceHttpClient, any[], any>
  >,
>(
  params: CommerceHttpClientParams,
  functions: TFunctions,
): ApiClientRecord<AdobeCommerceHttpClient, TFunctions>;
```

Defined in: [commerce/lib/api-client.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-events/source/commerce/lib/api-client.ts#L56)

Creates a customized Commerce Events API client.

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="type-parameter-tfunctions"></a> `TFunctions` _extends_ `Record`\<`string`, `ApiFunction`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `any`[], `any`\>\> |

## Parameters

| Parameter   | Type                       | Description                                                                                          |
| ----------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `params`    | `CommerceHttpClientParams` | The parameters to build the Commerce HTTP client that will communicate with the Commerce Events API. |
| `functions` | `TFunctions`               | The API functions to include in the client.                                                          |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `TFunctions`\>
