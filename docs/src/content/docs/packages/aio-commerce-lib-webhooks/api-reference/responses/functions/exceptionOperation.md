---
title: "exceptionOperation()"
editUrl: false
prev: false
next: false
---

```ts
function exceptionOperation(
  message: string,
  exceptionClass?: string,
): ExceptionOperation;
```

Defined in: [responses/operations/presets.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L49)

Creates an exception operation response with a message
Causes Commerce to terminate the process that triggered the original event.

## Parameters

| Parameter         | Type     | Description                   |
| ----------------- | -------- | ----------------------------- |
| `message`         | `string` | Exception message             |
| `exceptionClass?` | `string` | Optional exception class name |

## Returns

[`ExceptionOperation`](../type-aliases/ExceptionOperation.md)

## Example

```typescript
return exceptionOperation(
  "The product cannot be added to the cart because it is out of stock",
);

return exceptionOperation(
  "Custom error occurred",
  "Path\\To\\Exception\\Class",
);
```
