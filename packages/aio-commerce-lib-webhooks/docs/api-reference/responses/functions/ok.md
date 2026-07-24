# `ok()`

```ts
function ok<TValue>(
  operations: WebhookOperationResponse[] | WebhookOperationResponse<TValue>,
): SuccessResponse;
```

Defined in: [responses/presets.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-webhooks/source/responses/presets.ts#L43)

Creates an HTTP 200 OK response with webhook operation(s)
Webhook-optimized version of ok() that automatically wraps operations in the response body.

This function shadows the core library's ok() to provide a cleaner API for webhook actions.
Instead of `ok({ body: operation })`, you can simply use `ok(operation)`.

## Type Parameters

| Type Parameter | Default type | Description                                                            |
| -------------- | ------------ | ---------------------------------------------------------------------- |
| `TValue`       | `unknown`    | The type of the value for add/replace operations (defaults to unknown) |

## Parameters

| Parameter    | Type                                                                                                                                                                    | Description                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `operations` | \| [`WebhookOperationResponse`](../type-aliases/WebhookOperationResponse.md)[] \| [`WebhookOperationResponse`](../type-aliases/WebhookOperationResponse.md)\<`TValue`\> | Single webhook operation or array of operations |

## Returns

`SuccessResponse`

Success response with operations in body

## Example

```typescript
import {
  ok,
  successOperation,
} from "@adobe/aio-commerce-lib-webhooks/responses";

// Single operation
return ok(successOperation());

// Array of operations
return ok([addOperation("result", data), removeOperation("result/old_field")]);
```
