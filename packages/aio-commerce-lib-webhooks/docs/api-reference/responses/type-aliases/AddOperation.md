# `AddOperation\<TValue\>`

```ts
type AddOperation<TValue> = {
  instance?: string;
  op: "add";
  path: string;
  value: TValue;
};
```

Defined in: [responses/operations/types.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L38)

Add operation response
Causes Commerce to add the provided value to the provided path in the triggered event arguments.

## Type Parameters

| Type Parameter | Default type | Description                                             |
| -------------- | ------------ | ------------------------------------------------------- |
| `TValue`       | `unknown`    | The type of the value to be added (defaults to unknown) |

## Properties

### instance?

```ts
optional instance: string;
```

Defined in: [responses/operations/types.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L45)

Specifies the DataObject class name to create, based on the value and added to the provided path.

---

### op

```ts
op: "add";
```

Defined in: [responses/operations/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L39)

---

### path

```ts
path: string;
```

Defined in: [responses/operations/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L41)

Specifies the path at which the value should be added to the triggered event arguments.

---

### value

```ts
value: TValue;
```

Defined in: [responses/operations/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L43)

Specifies the value to be added. This can be a single value or in an array format.
