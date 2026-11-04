# `updateEventProvider()`

```ts
function updateEventProvider(
  httpClient: AdobeCommerceHttpClient,
  params: {
    description?: string;
    id: number;
    instance_id: string;
    label?: string;
    provider_id: string;
    workspace_configuration?:
      | string
      | {
          [key: string]: unknown;
        };
  },
  fetchOptions?: Options,
): Promise<CommerceEventProvider>;
```

Defined in: [commerce/api/event-providers/endpoints.ts:122](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-events/source/commerce/api/event-providers/endpoints.ts#L122)

Updates an event provider in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).
Omitted `label`, `description` and `workspace_configuration` keep their stored values.

## Parameters

| Parameter                         | Type                                                                                                                                                                                                    | Description                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                      | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                                    | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                          | \{ `description?`: `string`; `id`: `number`; `instance_id`: `string`; `label?`: `string`; `provider_id`: `string`; `workspace_configuration?`: \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}; \} | The parameters to update the event provider with.                                                                                                                                                  |
| `params.description?`             | `string`                                                                                                                                                                                                | -                                                                                                                                                                                                  |
| `params.id?`                      | `number`                                                                                                                                                                                                | -                                                                                                                                                                                                  |
| `params.instance_id?`             | `string`                                                                                                                                                                                                | -                                                                                                                                                                                                  |
| `params.label?`                   | `string`                                                                                                                                                                                                | -                                                                                                                                                                                                  |
| `params.provider_id?`             | `string`                                                                                                                                                                                                | -                                                                                                                                                                                                  |
| `params.workspace_configuration?` | \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}                                                                                                                                                    | -                                                                                                                                                                                                  |
| `fetchOptions?`                   | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                              | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<[`CommerceEventProvider`](../type-aliases/CommerceEventProvider.md)\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#update-an-event-provider

Commerce looks the provider up by `id` (its numeric Commerce ID, not the I/O provider ID) and
overwrites `provider_id` and `instance_id` with the given values. Read the provider first and
pass its own `id`, `provider_id` and `instance_id`.

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
