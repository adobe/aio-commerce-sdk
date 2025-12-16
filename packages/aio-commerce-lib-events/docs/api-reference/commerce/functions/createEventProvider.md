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
): Promise<{
  description?: string;
  id: string;
  instanceId?: string;
  label?: string;
  providerId: string;
  workspaceConfiguration?: string;
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-providers/endpoints.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-events/source/commerce/api/event-providers/endpoints.ts#L101)

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

`Promise`\<\{
`description?`: `string`;
`id`: `string`;
`instanceId?`: `string`;
`label?`: `string`;
`providerId`: `string`;
`workspaceConfiguration?`: `string`;
\}\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#create-an-event-provider

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
