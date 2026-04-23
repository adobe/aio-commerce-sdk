# `removeOperation()`

```ts
function removeOperation(path: string): RemoveOperation;
```

Defined in: [responses/operations/presets.ts:125](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L125)

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
