# `createEventMetadataForProvider()`

```ts
function createEventMetadataForProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    consumerOrgId: string;
    description: string;
    eventCode: string;
    label: string;
    projectId: string;
    providerId: string;
    sampleEventTemplate?:
      | string
      | {
          [key: string]: unknown;
        }
      | unknown[];
    workspaceId: string;
  },
  fetchOptions?: Options,
): Promise<IoEventMetadataHalModel>;
```

Defined in: [io-events/api/event-metadata/endpoints.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-metadata/endpoints.ts#L100)

Creates event metadata for a provider.

## Parameters

| Parameter                     | Type                                                                                                                                                                                                                                                                     | Description                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                  | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)                                                                                                     | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                      | \{ `consumerOrgId`: `string`; `description`: `string`; `eventCode`: `string`; `label`: `string`; `projectId`: `string`; `providerId`: `string`; `sampleEventTemplate?`: \| `string` \| \{ \[`key`: `string`\]: `unknown`; \} \| `unknown`[]; `workspaceId`: `string`; \} | The parameters to create the event metadata with.                                                                                                                                                  |
| `params.consumerOrgId`        | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.description?`         | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.eventCode?`           | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.label?`               | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.projectId?`           | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.providerId?`          | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.sampleEventTemplate?` | \| `string` \| \{ \[`key`: `string`\]: `unknown`; \} \| `unknown`[]                                                                                                                                                                                                      | -                                                                                                                                                                                                  |
| `params.workspaceId?`         | `string`                                                                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `fetchOptions?`               | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                                                               | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`IoEventMetadataHalModel`\>

## See

https://developer.adobe.com/events/docs/api#operation/postEventMetadata

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
