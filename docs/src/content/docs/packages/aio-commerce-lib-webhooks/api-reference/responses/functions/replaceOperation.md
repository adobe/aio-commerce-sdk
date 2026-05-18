---
title: "replaceOperation()"
editUrl: false
prev: false
next: false
---

```ts
function replaceOperation<TValue>(
  path: string,
  value: TValue,
  instance?: string,
): ReplaceOperation<TValue>;
```

Defined in: [responses/operations/presets.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L101)

Creates a replace operation response
Causes Commerce to replace a value in triggered event arguments for the provided path.

## Type Parameters

| Type Parameter | Default type | Description                       |
| -------------- | ------------ | --------------------------------- |
| `TValue`       | `unknown`    | The type of the replacement value |

## Parameters

| Parameter   | Type     | Description                                |
| ----------- | -------- | ------------------------------------------ |
| `path`      | `string` | Path at which the value should be replaced |
| `value`     | `TValue` | Replacement value                          |
| `instance?` | `string` | Optional DataObject class name             |

## Returns

[`ReplaceOperation`](../type-aliases/ReplaceOperation.md)\<`TValue`\>

## Example

```typescript
return replaceOperation(
  "result/shipping_methods/shipping_method_one/amount",
  6,
);
```
