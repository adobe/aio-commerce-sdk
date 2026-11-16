# `addOperation()`

```ts
function addOperation<TValue = unknown>(
  path: string,
  value: TValue,
  instance?: string,
): AddOperation<TValue>;
```

Defined in: [responses/operations/presets.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/responses/operations/presets.ts#L76)

Creates an add operation response
Causes Commerce to add the provided value to the provided path in the triggered event arguments.

## Type Parameters

| Type Parameter                              | Default type | Description                       |
| ------------------------------------------- | ------------ | --------------------------------- |
| <a id="type-parameter-tvalue"></a> `TValue` | `unknown`    | The type of the value to be added |

## Parameters

| Parameter   | Type     | Description                             |
| ----------- | -------- | --------------------------------------- |
| `path`      | `string` | Path at which the value should be added |
| `value`     | `TValue` | Value to be added                       |
| `instance?` | `string` | Optional DataObject class name          |

## Returns

[`AddOperation`](../type-aliases/AddOperation.md)\<`TValue`\>

## Example

```typescript
return addOperation(
  "result",
  { data: { amount: "5", carrier_code: "newshipmethod" } },
  "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
);
```
