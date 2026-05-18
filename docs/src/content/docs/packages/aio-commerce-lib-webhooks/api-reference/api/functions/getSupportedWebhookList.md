---
title: "getSupportedWebhookList()"
editUrl: false
prev: false
next: false
---

```ts
function getSupportedWebhookList(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
): Promise<CommerceSupportedWebhookManyResponse>;
```

Defined in: [api/webhooks/endpoints.ts:107](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-webhooks/source/api/webhooks/endpoints.ts#L107)

Returns the list of webhooks supported in Adobe Commerce as a Cloud Service (SaaS only).

## Parameters

| Parameter       | Type                                                                                                                                                                       | Description                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`    | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md) | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `fetchOptions?` | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                 | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                                 |

## Returns

`Promise`\<[`CommerceSupportedWebhookManyResponse`](../type-aliases/CommerceSupportedWebhookManyResponse.md)\>

## See

https://developer.adobe.com/commerce/extensibility/webhooks/api/#get-supported-webhooks-for-saas
