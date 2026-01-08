# `addOperation()`

```ts
function addOperation(
  path: string,
  value: unknown,
  instance?: string,
): AddOperation;
```

Defined in: [operations/presets.ts:86](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/presets.ts#L86)

Creates an add operation response
Causes Commerce to add the provided value to the provided path in the triggered event arguments.
See [buildAddOperation](buildAddOperation.md) for details.

## Parameters

| Parameter   | Type      | Description                             |
| ----------- | --------- | --------------------------------------- |
| `path`      | `string`  | Path at which the value should be added |
| `value`     | `unknown` | Value to be added                       |
| `instance?` | `string`  | Optional DataObject class name          |

## Returns

[`AddOperation`](../type-aliases/AddOperation.md)

## Example

```typescript
return addOperation(
  "result",
  { data: { amount: "5", carrier_code: "newshipmethod" } },
  "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
);
```
