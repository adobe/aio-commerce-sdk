# `createEventProvider()`

```ts
function createEventProvider(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    consumerOrgId: string;
    dataResidencyRegion?: "va6" | "irl1";
    description?: string;
    docsUrl?: string;
    instanceId?: string;
    label: string;
    projectId: string;
    providerType?: "dx_commerce_events" | "3rd_party_custom_events";
    workspaceId: string;
  },
  fetchOptions?: Options,
): Promise<IoEventProviderHalModel>;
```

Defined in: [io-events/api/event-providers/endpoints.ts:120](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-providers/endpoints.ts#L120)

Creates an event provider.

## Parameters

| Parameter                     | Type                                                                                                                                                                                                                                                                                              | Description                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                  | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md)                                                                                                                              | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                      | \{ `consumerOrgId`: `string`; `dataResidencyRegion?`: `"va6"` \| `"irl1"`; `description?`: `string`; `docsUrl?`: `string`; `instanceId?`: `string`; `label`: `string`; `projectId`: `string`; `providerType?`: `"dx_commerce_events"` \| `"3rd_party_custom_events"`; `workspaceId`: `string`; \} | The parameters to create the event provider with.                                                                                                                                                  |
| `params.consumerOrgId`        | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.dataResidencyRegion?` | `"va6"` \| `"irl1"`                                                                                                                                                                                                                                                                               | -                                                                                                                                                                                                  |
| `params.description?`         | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.docsUrl?`             | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.instanceId?`          | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.label?`               | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.projectId?`           | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.providerType?`        | `"dx_commerce_events"` \| `"3rd_party_custom_events"`                                                                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.workspaceId?`         | `string`                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `fetchOptions?`               | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                                                                                        | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`IoEventProviderHalModel`\>

## See

https://developer.adobe.com/events/docs/api#operation/createProvider

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
