# `isWebhookSuccessful()`

```ts
function isWebhookSuccessful(result: unknown): boolean;
```

Defined in: [responses/helpers.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-webhooks/source/responses/helpers.ts#L32)

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
