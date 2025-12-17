# `buildSuccessOperation()`

```ts
function buildSuccessOperation(): SuccessOperation;
```

Defined in: [operations/helpers.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L118)

Creates a success operation response
The process that triggered the original event continues without any changes.

## Returns

[`SuccessOperation`](../type-aliases/SuccessOperation.md)

Success operation response

## Example

```typescript
const response = buildSuccessOperation();
// Returns: { op: "success" }
```
