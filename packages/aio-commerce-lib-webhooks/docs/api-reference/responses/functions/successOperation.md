# `successOperation()`

```ts
function successOperation(): SuccessOperation;
```

Defined in: [responses/operations/presets.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L30)

Creates a success operation response
The process that triggered the original event continues without any changes.

## Returns

[`SuccessOperation`](../type-aliases/SuccessOperation.md)

## Example

```typescript
return successOperation();
```
