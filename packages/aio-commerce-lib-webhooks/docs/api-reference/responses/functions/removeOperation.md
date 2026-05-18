# `removeOperation()`

```ts
function removeOperation(path: string): RemoveOperation;
```

Defined in: [responses/operations/presets.ts:123](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L123)

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
