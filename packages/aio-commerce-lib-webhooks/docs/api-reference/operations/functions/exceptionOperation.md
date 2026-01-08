# `exceptionOperation()`

```ts
function exceptionOperation(
  message: string,
  exceptionClass?: string,
): ExceptionOperation;
```

Defined in: [operations/presets.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/presets.ts#L59)

Creates an exception operation response with a message
Causes Commerce to terminate the process that triggered the original event.
See [buildExceptionOperation](buildExceptionOperation.md) for details.

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
