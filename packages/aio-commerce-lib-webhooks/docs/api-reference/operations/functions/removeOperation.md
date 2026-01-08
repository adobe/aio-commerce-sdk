# `removeOperation()`

```ts
function removeOperation(path: string): RemoveOperation;
```

Defined in: [operations/presets.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/presets.ts#L124)

Creates a remove operation response
Causes Commerce to remove a value or node in triggered event arguments by the provided path.
See [buildRemoveOperation](buildRemoveOperation.md) for details.

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
