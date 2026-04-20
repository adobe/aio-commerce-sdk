# `deleteEventProvider()`

```ts
function deleteEventProvider(
  httpClient: AdobeCommerceHttpClient,
  params: {
    provider_id: string;
  },
  fetchOptions?: Options,
): Promise<void>;
```

Defined in: [commerce/api/event-providers/endpoints.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-events/source/commerce/api/event-providers/endpoints.ts#L116)

Deletes the event provider with the given ID from the Commerce instance.
All event subscriptions that use this provider must be deleted first.

## Parameters

| Parameter            | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`         | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`             | \{ `provider_id`: `string`; \}                                                                                                                                       | The parameters to delete the event provider with.                                                                                                                                                  |
| `params.provider_id` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`      | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`void`\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#delete-event-provider

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
