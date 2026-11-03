# `updateEventProvider()`

```ts
function updateEventProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    consumerOrgId: string;
    description?: string;
    docsUrl?: string;
    label: string;
    projectId: string;
    providerId: string;
    workspaceId: string;
  },
  fetchOptions?: Options,
): Promise<IoEventProviderHalModel>;
```

Defined in: [io-events/api/event-providers/endpoints.ts:161](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts#L161)

Updates an event provider. This replaces the provider: a `description` or `docsUrl` that is
omitted is reset to the default of the provider type, not kept.

## Parameters

| Parameter               | Type                                                                                                                                                                        | Description                                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`            | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)        | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                | \{ `consumerOrgId`: `string`; `description?`: `string`; `docsUrl?`: `string`; `label`: `string`; `projectId`: `string`; `providerId`: `string`; `workspaceId`: `string`; \} | The parameters to update the event provider with.                                                                                                                                                  |
| `params.consumerOrgId?` | `string`                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.description?`   | `string`                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.docsUrl?`       | `string`                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.label?`         | `string`                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.projectId?`     | `string`                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.providerId?`    | `string`                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `params.workspaceId?`   | `string`                                                                                                                                                                    | -                                                                                                                                                                                                  |
| `fetchOptions?`         | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                  | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`IoEventProviderHalModel`\>

## See

https://developer.adobe.com/events/docs/api#operation/putProvider

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
