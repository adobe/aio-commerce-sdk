# `createEventProvider()`

```ts
function createEventProvider(
  httpClient: AdobeCommerceHttpClient,
  params: {
    associatedWorkspaceConfiguration?:
      | string
      | {
          [key: string]: unknown;
        };
    description?: string;
    instanceId: string;
    label?: string;
    providerId: string;
  },
  fetchOptions?: Options,
): Promise<CommerceEventProvider>;
```

Defined in: [commerce/api/event-providers/endpoints.ts:87](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/commerce/api/event-providers/endpoints.ts#L87)

Creates an event provider in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).

## Parameters

| Parameter                                  | Type                                                                                                                                                                                           | Description                                                                                                                                                                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                               | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                           | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                                   | \{ `associatedWorkspaceConfiguration?`: \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}; `description?`: `string`; `instanceId`: `string`; `label?`: `string`; `providerId`: `string`; \} | The parameters to create the event provider with.                                                                                                                                                  |
| `params.associatedWorkspaceConfiguration?` | \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}                                                                                                                                           | -                                                                                                                                                                                                  |
| `params.description?`                      | `string`                                                                                                                                                                                       | -                                                                                                                                                                                                  |
| `params.instanceId?`                       | `string`                                                                                                                                                                                       | -                                                                                                                                                                                                  |
| `params.label?`                            | `string`                                                                                                                                                                                       | -                                                                                                                                                                                                  |
| `params.providerId?`                       | `string`                                                                                                                                                                                       | -                                                                                                                                                                                                  |
| `fetchOptions?`                            | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                     | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<[`CommerceEventProvider`](../type-aliases/CommerceEventProvider.md)\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#create-an-event-provider

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
