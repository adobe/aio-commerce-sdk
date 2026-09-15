# `isWebhookSuccessResponse()`

```ts
function isWebhookSuccessResponse(
  response: unknown,
): response is WebhookSuccessResponse;
```

Defined in: [responses/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-webhooks/source/responses/types.ts#L44)

Determines whether a value is a successful SDK response containing webhook operation response body data.

## Parameters

| Parameter  | Type      | Description       |
| ---------- | --------- | ----------------- |
| `response` | `unknown` | Value to inspect. |

## Returns

`response is WebhookSuccessResponse`

True when the value matches the webhook success response shape.
