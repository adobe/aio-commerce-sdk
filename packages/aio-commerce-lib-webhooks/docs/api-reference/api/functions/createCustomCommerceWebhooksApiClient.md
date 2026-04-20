# `createCustomCommerceWebhooksApiClient()`

```ts
function createCustomCommerceWebhooksApiClient<TFunctions>(
  params: CommerceHttpClientParams,
  functions: TFunctions,
): ApiClientRecord<AdobeCommerceHttpClient, TFunctions>;
```

Defined in: [lib/api-client.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/lib/api-client.ts#L58)

Creates a customized Commerce Webhooks API client with a user-specified set of endpoint functions.

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/type-aliases/ApiFunction.md)\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `any`[], `any`\>\> |

## Parameters

| Parameter   | Type                                                                                                                                                                              | Description                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `params`    | [`CommerceHttpClientParams`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/type-aliases/CommerceHttpClientParams.md) | The parameters to build the Commerce HTTP client. |
| `functions` | `TFunctions`                                                                                                                                                                      | The API functions to include in the client.       |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `TFunctions`\>
