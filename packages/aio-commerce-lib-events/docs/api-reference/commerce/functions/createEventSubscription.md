# `createEventSubscription()`

```ts
function createEventSubscription(
  httpClient: AdobeCommerceHttpClient,
  params: {
    destination?: string;
    fields: {
      name: string;
    }[];
    force?: boolean;
    hipaaAuditRequired?: boolean;
    name: string;
    parent?: string;
    prioritary?: boolean;
    providerId?: string;
  },
  fetchOptions?: Options,
): Promise<void>;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/endpoints.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/endpoints.ts#L58)

Creates an event subscription in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).

## Parameters

| Parameter                    | Type                                                                                                                                                                                                                  | Description                                                                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                 | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                                                  | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                     | \{ `destination?`: `string`; `fields`: \{ `name`: `string`; \}[]; `force?`: `boolean`; `hipaaAuditRequired?`: `boolean`; `name`: `string`; `parent?`: `string`; `prioritary?`: `boolean`; `providerId?`: `string`; \} | The parameters to create the event subscription with.                                                                                                                                              |
| `params.destination?`        | `string`                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `params.fields?`             | \{ `name`: `string`; \}[]                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.force?`              | `boolean`                                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.hipaaAuditRequired?` | `boolean`                                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.name?`               | `string`                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `params.parent?`             | `string`                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `params.prioritary?`         | `boolean`                                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.providerId?`         | `string`                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `fetchOptions?`              | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                            | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`void`\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#subscribe-to-events

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
