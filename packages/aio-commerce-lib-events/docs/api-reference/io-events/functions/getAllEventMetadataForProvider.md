# `getAllEventMetadataForProvider()`

```ts
function getAllEventMetadataForProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    providerId: string;
  },
  fetchOptions?: Options,
): Promise<IoEventMetadataManyResponse>;
```

Defined in: [io-events/api/event-metadata/endpoints.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts#L45)

Gets all event metadata for a specific provider.

## Parameters

| Parameter           | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`        | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`            | \{ `providerId`: `string`; \}                                                                                                                                        | The parameters to get the event metadata with.                                                                                                                                                     |
| `params.providerId` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`     | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<[`IoEventMetadataManyResponse`](../type-aliases/IoEventMetadataManyResponse.md)\>

## See

https://developer.adobe.com/events/docs/api#operation/getByProviderId

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
