---
title: "getEventProviderById()"
editUrl: false
prev: false
next: false
---

```ts
function getEventProviderById(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    providerId: string;
    withEventMetadata?: boolean;
  },
  fetchOptions?: Options,
): Promise<IoEventProviderHalModel>;
```

Defined in: [io-events/api/event-providers/endpoints.ts:86](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts#L86)

Gets an event provider by ID.

## Parameters

| Parameter                   | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                    | \{ `providerId`: `string`; `withEventMetadata?`: `boolean`; \}                                                                                                       | The parameters to get the event provider by.                                                                                                                                                       |
| `params.providerId`         | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.withEventMetadata?` | `boolean`                                                                                                                                                            | -                                                                                                                                                                                                  |
| `fetchOptions?`             | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`IoEventProviderHalModel`\>

## See

https://developer.adobe.com/events/docs/api#operation/getProvidersById

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
