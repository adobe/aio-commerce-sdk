# `isWebhookSuccessful()`

```ts
function isWebhookSuccessful(result: unknown): boolean;
```

Defined in: [responses/helpers.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-webhooks/source/responses/helpers.ts#L32)

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
