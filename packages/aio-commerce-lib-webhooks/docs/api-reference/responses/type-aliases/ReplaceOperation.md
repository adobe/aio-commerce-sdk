# `ReplaceOperation\<TValue\>`

```ts
type ReplaceOperation<TValue> = {
  instance?: string;
  op: "replace";
  path: string;
  value: TValue;
};
```

Defined in: [responses/operations/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L53)

Replace operation response
Causes Commerce to replace a value in triggered event arguments for the provided path.

## Type Parameters

| Type Parameter | Default type | Description                                             |
| -------------- | ------------ | ------------------------------------------------------- |
| `TValue`       | `unknown`    | The type of the replacement value (defaults to unknown) |

## Properties

### instance?

```ts
optional instance: string;
```

Defined in: [responses/operations/types.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L60)

Specifies the DataObject class name to create, based on the value and added to the provided path.

---

### op

```ts
op: "replace";
```

Defined in: [responses/operations/types.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L54)

---

### path

```ts
path: string;
```

Defined in: [responses/operations/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L56)

Specifies the path at which the value should be replaced with the provided value.

---

### value

```ts
value: TValue;
```

Defined in: [responses/operations/types.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L58)

Specifies the replacement value. This can be a single value or in an array format.
