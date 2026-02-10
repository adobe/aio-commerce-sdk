# `createEventSubscription()`

```ts
function createEventSubscription(
  httpClient: AdobeCommerceHttpClient,
  params: {
    destination?: string;
    fields: {
      name: string;
      converter?: string;
      source?: string;
    }[];
    force?: boolean;
    hipaaAuditRequired?: boolean;
    name: string;
    parent?: string;
    prioritary?: boolean;
    providerId?: string;
    rules?: {
      field: string;
      operator: string;
      value: string;
    }[];
  },
  fetchOptions?: Options,
): Promise<void>;
```

Defined in: [commerce/api/event-subscriptions/endpoints.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/endpoints.ts#L57)

Creates an event subscription in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).

## Parameters

| Parameter                    | Type                                                                                                                                                                                                                                                                                                                                              | Description                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                 | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                                                                                                                                                                              | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                     | \{ `destination?`: `string`; `fields`: \{ `name`: `string`; `converter?`: `string`; `source?`: `string`; \}[]; `force?`: `boolean`; `hipaaAuditRequired?`: `boolean`; `name`: `string`; `parent?`: `string`; `prioritary?`: `boolean`; `providerId?`: `string`; `rules?`: \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]; \} | The parameters to create the event subscription with.                                                                                                                                              |
| `params.destination?`        | `string`                                                                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.fields?`             | \{ `name`: `string`; `converter?`: `string`; `source?`: `string`; \}[]                                                                                                                                                                                                                                                                            | -                                                                                                                                                                                                  |
| `params.force?`              | `boolean`                                                                                                                                                                                                                                                                                                                                         | -                                                                                                                                                                                                  |
| `params.hipaaAuditRequired?` | `boolean`                                                                                                                                                                                                                                                                                                                                         | -                                                                                                                                                                                                  |
| `params.name?`               | `string`                                                                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.parent?`             | `string`                                                                                                                                                                                                                                                                                                                                          | Required when `rules` is present. The parent event subscription identifier.                                                                                                                        |
| `params.prioritary?`         | `boolean`                                                                                                                                                                                                                                                                                                                                         | -                                                                                                                                                                                                  |
| `params.providerId?`         | `string`                                                                                                                                                                                                                                                                                                                                          | -                                                                                                                                                                                                  |
| `params.rules?`              | \{ `field`: `string`; `operator`: `string`; `value`: `string`; \}[]                                                                                                                                                                                                                                                                               | Optional array of filtering rules. If provided, `parent` must also be provided.                                                                                                                    |
| `fetchOptions?`              | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                                                                                                                                        | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Notes

- If `rules` is provided, `parent` must also be provided.

## Returns

`Promise`\<`void`\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#subscribe-to-events

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
