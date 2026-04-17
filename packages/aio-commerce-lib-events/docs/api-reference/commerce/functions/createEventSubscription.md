# `createEventSubscription()`

```ts
function createEventSubscription(
  httpClient: AdobeCommerceHttpClient,
  params: {
    destination?: string;
    fields: {
      name: string;
      source?: string;
    }[];
    force?: boolean;
    hipaa_audit_required?: boolean;
    name: string;
    parent?: string;
    priority?: boolean;
    provider_id?: string;
    rules?: {
      field: string;
      operator:
        | "regex"
        | "greaterThan"
        | "lessThan"
        | "equal"
        | "in"
        | "onChange";
      value: string;
    }[];
  },
  fetchOptions?: Options,
): Promise<void>;
```

Defined in: [commerce/api/event-subscriptions/endpoints.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/endpoints.ts#L56)

Creates an event subscription in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).

## Parameters

| Parameter                      | Type                                                                                                                                                                                                                                                                                                                                                                                                  | Description                                                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                   | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                                                                                                                                                                                                                                  | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                       | \{ `destination?`: `string`; `fields`: \{ `name`: `string`; `source?`: `string`; \}[]; `force?`: `boolean`; `hipaa_audit_required?`: `boolean`; `name`: `string`; `parent?`: `string`; `priority?`: `boolean`; `provider_id?`: `string`; `rules?`: \{ `field`: `string`; `operator`: `"regex"` \| `"greaterThan"` \| `"lessThan"` \| `"equal"` \| `"in"` \| `"onChange"`; `value`: `string`; \}[]; \} | The parameters to create the event subscription with.                                                                                                                                              |
| `params.destination?`          | `string`                                                                                                                                                                                                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `params.fields?`               | \{ `name`: `string`; `source?`: `string`; \}[]                                                                                                                                                                                                                                                                                                                                                        | -                                                                                                                                                                                                  |
| `params.force?`                | `boolean`                                                                                                                                                                                                                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.hipaa_audit_required?` | `boolean`                                                                                                                                                                                                                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.name?`                 | `string`                                                                                                                                                                                                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `params.parent?`               | `string`                                                                                                                                                                                                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `params.priority?`             | `boolean`                                                                                                                                                                                                                                                                                                                                                                                             | -                                                                                                                                                                                                  |
| `params.provider_id?`          | `string`                                                                                                                                                                                                                                                                                                                                                                                              | -                                                                                                                                                                                                  |
| `params.rules?`                | \{ `field`: `string`; `operator`: `"regex"` \| `"greaterThan"` \| `"lessThan"` \| `"equal"` \| `"in"` \| `"onChange"`; `value`: `string`; \}[]                                                                                                                                                                                                                                                        | -                                                                                                                                                                                                  |
| `fetchOptions?`                | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                                                                                                                                                                                            | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`void`\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#subscribe-to-events

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
