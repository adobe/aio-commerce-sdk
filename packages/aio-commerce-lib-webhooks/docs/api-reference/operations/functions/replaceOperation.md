# `replaceOperation()`

```ts
function replaceOperation(
  path: string,
  value: unknown,
  instance?: string,
): ReplaceOperation;
```

Defined in: [operations/presets.ts:106](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/presets.ts#L106)

Creates a replace operation response
Causes Commerce to replace a value in triggered event arguments for the provided path.
See [buildReplaceOperation](buildReplaceOperation.md) for details.

## Parameters

| Parameter   | Type      | Description                                |
| ----------- | --------- | ------------------------------------------ |
| `path`      | `string`  | Path at which the value should be replaced |
| `value`     | `unknown` | Replacement value                          |
| `instance?` | `string`  | Optional DataObject class name             |

## Returns

[`ReplaceOperation`](../type-aliases/ReplaceOperation.md)

## Example

```typescript
return replaceOperation(
  "result/shipping_methods/shipping_method_one/amount",
  6,
);
```
