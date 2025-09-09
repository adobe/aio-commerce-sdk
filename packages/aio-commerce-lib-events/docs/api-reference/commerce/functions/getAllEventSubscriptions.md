# `getAllEventSubscriptions()`

```ts
function getAllEventSubscriptions(
  httpClient: AdobeCommerceHttpClient,
  fetchOptions?: Options,
): Promise<CommerceEventSubscriptionManyResponse>;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/endpoints.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/endpoints.ts#L23)

Gets all event subscriptions in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).

## Parameters

| Parameter       | Type                                                                                                                                                                         | Description                                                                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`    | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `fetchOptions?` | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                   | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                                   |

## Returns

`Promise`\<[`CommerceEventSubscriptionManyResponse`](../type-aliases/CommerceEventSubscriptionManyResponse.md)\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#get-a-list-of-all-subscribed-events
