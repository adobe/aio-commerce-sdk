# `buildExceptionOperation()`

```ts
function buildExceptionOperation(payload?: {
  class?: string;
  message?: string;
}): ExceptionOperation;
```

Defined in: [operations/helpers.ts:144](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L144)

Creates an exception operation response
Causes Commerce to terminate the process that triggered the original event.

## Parameters

| Parameter          | Type                                            | Description                   |
| ------------------ | ----------------------------------------------- | ----------------------------- |
| `payload?`         | \{ `class?`: `string`; `message?`: `string`; \} | Exception configuration       |
| `payload.class?`   | `string`                                        | Optional exception class name |
| `payload.message?` | `string`                                        | Exception message             |

## Returns

[`ExceptionOperation`](../type-aliases/ExceptionOperation.md)

Exception operation response

## Example

```typescript
const response = buildExceptionOperation({
  message: "The product cannot be added to the cart because it is out of stock",
});

const customException = buildExceptionOperation({
  message: "Custom error occurred",
  class: "Path\\To\\Exception\\Class",
});
```
