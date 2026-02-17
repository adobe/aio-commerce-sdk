# `getRegistrationById()`

```ts
function getRegistrationById(
  httpClient: AdobeIoEventsHttpClient,
  params: {
    consumerOrgId: string;
    projectId: string;
    registrationId: string;
    workspaceId: string;
  },
  fetchOptions?: Options,
): Promise<IoEventRegistrationHalModel>;
```

Defined in: [io-events/api/event-registrations/endpoints.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-events/source/io-events/api/event-registrations/endpoints.ts#L104)

Gets an event registration by ID.

## Parameters

| Parameter                | Type                                                                                                                                                                 | Description                                                                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`             | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use to make the request. |
| `params`                 | \{ `consumerOrgId`: `string`; `projectId`: `string`; `registrationId`: `string`; `workspaceId`: `string`; \}                                                         | The parameters to get the registration with.                                                                                                                                                       |
| `params.consumerOrgId`   | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.projectId?`      | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.registrationId?` | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.workspaceId?`    | `string`                                                                                                                                                             | -                                                                                                                                                                                                  |
| `fetchOptions?`          | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`IoEventRegistrationHalModel`\>

## See

https://developer.adobe.com/events/docs/api#operation/getRegistration

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
