# `ok()`

```ts
function ok(
  operations: WebhookOperationResponse | WebhookOperationResponse[],
): SuccessResponse;
```

Defined in: [responses/presets.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/responses/presets.ts#L45)

Creates an HTTP 200 OK response with webhook operation(s)
Webhook-optimized version of ok() that automatically wraps operations in the response body.

This function shadows the core library's ok() to provide a cleaner API for webhook actions.
Instead of `ok({ body: operation })`, you can simply use `ok(operation)`.

## Parameters

| Parameter    | Type                                                                                                                                                                                    | Description                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `operations` | \| [`WebhookOperationResponse`](../../operations/type-aliases/WebhookOperationResponse.md) \| [`WebhookOperationResponse`](../../operations/type-aliases/WebhookOperationResponse.md)[] | Single webhook operation or array of operations |

## Returns

`SuccessResponse`

Success response with operations in body

## Example

```typescript
import { ok, successOperation } from "@adobe/aio-commerce-lib-webhooks";

// Single operation
return ok(successOperation());

// Array of operations
return ok([addOperation("result", data), removeOperation("result/old_field")]);
```
