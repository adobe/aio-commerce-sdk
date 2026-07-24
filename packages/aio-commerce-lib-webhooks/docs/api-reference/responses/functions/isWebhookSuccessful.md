# `isWebhookSuccessful()`

```ts
function isWebhookSuccessful(result: unknown): boolean;
```

Defined in: [responses/helpers.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-webhooks/source/responses/helpers.ts#L32)

Determines whether a webhook action's result represents a successful outcome.
Adobe Commerce webhooks always respond with HTTP 200, even when the handler
wants to block the triggering process, so the actual outcome is only visible
in the response body's `op` field (`op: "exception"` signals a failure).

## Parameters

| Parameter | Type      | Description                                    |
| --------- | --------- | ---------------------------------------------- |
| `result`  | `unknown` | The result of the instrumented webhook action. |

## Returns

`boolean`

True if the webhook response is successful, false otherwise.

## Example

```typescript
import { isWebhookSuccessful } from "@adobe/aio-commerce-lib-webhooks/responses";

const result = await runWebhookAction(params);
span.setStatus(
  isWebhookSuccessful(result)
    ? { code: SpanStatusCode.OK }
    : { code: SpanStatusCode.ERROR },
);
```
