# `updateEventSubscription()`

```ts
function updateEventSubscription(
  httpClient: AdobeCommerceHttpClient,
  params: {
    destination?: string;
    fields: {
      name: string;
      source?: string;
    }[];
    hipaa_audit_required?: boolean;
    name: string;
    parent?: string;
    priority?: boolean;
    provider_id?: string;
    rules?: {
      field: string;
      operator:
        "regex" | "in" | "greaterThan" | "lessThan" | "equal" | "onChange";
      value: string;
    }[];
  },
  fetchOptions?: Options,
): Promise<void>;
```

Defined in: [commerce/api/event-subscriptions/endpoints.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/commerce/api/event-subscriptions/endpoints.ts#L101)

Updates an existing event subscription in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).

The Commerce update endpoint merges the provided `fields` and `rules` into the
existing subscription (keyed by field name and `field:operator` respectively);
it cannot remove entries. Callers reconciling toward a desired end state must
account for that (removals require re-subscribing the event).

## Parameters

| Parameter                      | Type                                                                                                                                                                                                                                                                                                                                                                             | Description                                                                                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                   | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                                                                                                                                                                                                             | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                       | \{ `destination?`: `string`; `fields`: \{ `name`: `string`; `source?`: `string`; \}[]; `hipaa_audit_required?`: `boolean`; `name`: `string`; `parent?`: `string`; `priority?`: `boolean`; `provider_id?`: `string`; `rules?`: \{ `field`: `string`; `operator`: `"regex"` \| `"in"` \| `"greaterThan"` \| `"lessThan"` \| `"equal"` \| `"onChange"`; `value`: `string`; \}[]; \} | The parameters to update the event subscription with.                                                                                                                                              |
| `params.destination?`          | `string`                                                                                                                                                                                                                                                                                                                                                                         | -                                                                                                                                                                                                  |
| `params.fields?`               | \{ `name`: `string`; `source?`: `string`; \}[]                                                                                                                                                                                                                                                                                                                                   | -                                                                                                                                                                                                  |
| `params.hipaa_audit_required?` | `boolean`                                                                                                                                                                                                                                                                                                                                                                        | -                                                                                                                                                                                                  |
| `params.name?`                 | `string`                                                                                                                                                                                                                                                                                                                                                                         | -                                                                                                                                                                                                  |
| `params.parent?`               | `string`                                                                                                                                                                                                                                                                                                                                                                         | -                                                                                                                                                                                                  |
| `params.priority?`             | `boolean`                                                                                                                                                                                                                                                                                                                                                                        | -                                                                                                                                                                                                  |
| `params.provider_id?`          | `string`                                                                                                                                                                                                                                                                                                                                                                         | -                                                                                                                                                                                                  |
| `params.rules?`                | \{ `field`: `string`; `operator`: `"regex"` \| `"in"` \| `"greaterThan"` \| `"lessThan"` \| `"equal"` \| `"onChange"`; `value`: `string`; \}[]                                                                                                                                                                                                                                   | -                                                                                                                                                                                                  |
| `fetchOptions?`                | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                                                                                                                                                                       | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`void`\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#update-an-event-subscription

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
