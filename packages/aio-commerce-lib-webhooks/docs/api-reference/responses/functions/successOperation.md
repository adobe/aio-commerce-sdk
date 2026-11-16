# `successOperation()`

```ts
function successOperation(): SuccessOperation;
```

Defined in: [responses/operations/presets.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L30)

Creates a success operation response
The process that triggered the original event continues without any changes.

## Returns

[`SuccessOperation`](../type-aliases/SuccessOperation.md)

## Example

```typescript
return successOperation();
```
