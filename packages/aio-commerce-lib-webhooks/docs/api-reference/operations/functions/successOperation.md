# `successOperation()`

```ts
function successOperation(): SuccessOperation;
```

Defined in: [operations/presets.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/presets.ts#L39)

Creates a success operation response
The process that triggered the original event continues without any changes.
See [buildSuccessOperation](buildSuccessOperation.md) for details.

## Returns

[`SuccessOperation`](../type-aliases/SuccessOperation.md)

## Example

```typescript
return successOperation();
```
