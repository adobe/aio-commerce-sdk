# `successOperation()`

```ts
function successOperation(): SuccessOperation;
```

Defined in: [responses/operations/presets.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L30)

Creates a success operation response
The process that triggered the original event continues without any changes.

## Returns

[`SuccessOperation`](../type-aliases/SuccessOperation.md)

## Example

```typescript
return successOperation();
```
