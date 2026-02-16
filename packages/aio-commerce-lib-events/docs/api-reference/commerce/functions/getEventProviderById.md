# `getEventProviderById()`

```ts
function getEventProviderById(
  httpClient: AdobeCommerceHttpClient,
  params: {
    providerId: string;
  },
  fetchOptions?: Options,
): Promise<CommerceEventProvider>;
```

Defined in: [commerce/api/event-providers/endpoints.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-events/source/commerce/api/event-providers/endpoints.ts#L61)

Gets the info of the event provider with the given ID of the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).

## Parameters

| Parameter           | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`        | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`            | \{ `providerId`: `string`; \}                                                                                                                                        | The parameters to get the event provider by.                                                                                                                                                       |
| `params.providerId` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`     | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<[`CommerceEventProvider`](../type-aliases/CommerceEventProvider.md)\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#get-event-provider-by-id

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
