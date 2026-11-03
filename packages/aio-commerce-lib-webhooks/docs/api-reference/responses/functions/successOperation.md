# `successOperation()`

```ts
function successOperation(): SuccessOperation;
```

Defined in: [responses/operations/presets.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L30)

Creates a success operation response
The process that triggered the original event continues without any changes.

## Returns

[`SuccessOperation`](../type-aliases/SuccessOperation.md)

## Example

```typescript
return successOperation();
```
