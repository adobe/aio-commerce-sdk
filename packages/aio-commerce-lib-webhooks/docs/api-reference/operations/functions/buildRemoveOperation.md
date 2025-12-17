# `buildRemoveOperation()`

```ts
function buildRemoveOperation(path: string): RemoveOperation;
```

Defined in: [operations/helpers.ts:232](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L232)

Creates a remove operation response
Causes Commerce to remove a value or node in triggered event arguments by the provided path.

## Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| `path`    | `string` | Path at which the value should be removed |

## Returns

[`RemoveOperation`](../type-aliases/RemoveOperation.md)

Remove operation response

## Example

```typescript
const response = buildRemoveOperation("result/key2");
// Removes the key2 element from the result
```
