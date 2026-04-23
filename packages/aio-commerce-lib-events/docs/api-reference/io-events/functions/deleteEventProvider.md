# `deleteEventProvider()`

```ts
function deleteEventProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    consumerOrgId: string;
    projectId: string;
    providerId: string;
    workspaceId: string;
  },
  fetchOptions?: Options,
): Promise<void>;
```

Defined in: [io-events/api/event-providers/endpoints.ts:158](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts#L158)

Deletes an event provider.

## Parameters

| Parameter              | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`           | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`               | \{ `consumerOrgId`: `string`; `projectId`: `string`; `providerId`: `string`; `workspaceId`: `string`; \}                                                             | The parameters to delete the event provider with.                                                                                                                                                  |
| `params.consumerOrgId` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.projectId?`    | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.providerId?`   | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.workspaceId?`  | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`        | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`void`\>

## See

https://developer.adobe.com/events/docs/api#operation/deleteProvider

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
