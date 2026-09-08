# `isWebhookSuccessResponse()`

```ts
function isWebhookSuccessResponse(
  response: unknown,
): response is WebhookSuccessResponse;
```

Defined in: [responses/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-webhooks/source/responses/types.ts#L44)

Determines whether a value is a successful SDK response containing webhook operation response body data.

## Parameters

| Parameter  | Type      | Description       |
| ---------- | --------- | ----------------- |
| `response` | `unknown` | Value to inspect. |

## Returns

`response is WebhookSuccessResponse`

True when the value matches the webhook success response shape.
