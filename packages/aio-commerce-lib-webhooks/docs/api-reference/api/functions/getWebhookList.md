# `getWebhookList()`

```ts
function getWebhookList(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
): Promise<CommerceWebhookManyResponse>;
```

Defined in: [api/webhooks/endpoints.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/api/webhooks/endpoints.ts#L39)

Returns a list of all subscribed webhooks in the Commerce instance.

## Parameters

| Parameter       | Type                                                                                                                                                                       | Description                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`    | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md) | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `fetchOptions?` | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                 | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                                 |

## Returns

`Promise`\<[`CommerceWebhookManyResponse`](../type-aliases/CommerceWebhookManyResponse.md)\>

## See

https://developer.adobe.com/commerce/extensibility/webhooks/api/#get-a-list-of-all-subscribed-webhooks
