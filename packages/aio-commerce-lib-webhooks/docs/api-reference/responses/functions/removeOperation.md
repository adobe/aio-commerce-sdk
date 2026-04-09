# `removeOperation()`

```ts
function removeOperation(path: string): RemoveOperation;
```

Defined in: [responses/operations/presets.ts:125](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L125)

Creates a remove operation response
Causes Commerce to remove a value or node in triggered event arguments by the provided path.

## Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| `path`    | `string` | Path at which the value should be removed |

## Returns

[`RemoveOperation`](../type-aliases/RemoveOperation.md)

## Example

```typescript
return removeOperation("result/key2");
```
