# `createCustomCommerceWebhooksApiClient()`

```ts
function createCustomCommerceWebhooksApiClient<
  TFunctions extends Record<
    string,
    ApiFunction<AdobeCommerceHttpClient, any[], any>
  >,
>(
  params: CommerceHttpClientParams,
  functions: TFunctions,
): ApiClientRecord<AdobeCommerceHttpClient, TFunctions>;
```

Defined in: [lib/api-client.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-webhooks/source/lib/api-client.ts#L58)

Creates a customized Commerce Webhooks API client with a user-specified set of endpoint functions.

## Type Parameters

| Type Parameter                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="type-parameter-tfunctions"></a> `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/type-aliases/ApiFunction.md)\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `any`[], `any`\>\> |

## Parameters

| Parameter   | Type                                                                                                                                                                              | Description                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `params`    | [`CommerceHttpClientParams`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/type-aliases/CommerceHttpClientParams.md) | The parameters to build the Commerce HTTP client. |
| `functions` | `TFunctions`                                                                                                                                                                      | The API functions to include in the client.       |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `TFunctions`\>
