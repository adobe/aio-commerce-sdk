# `AddOperation`

```ts
type AddOperation = {
  instance?: string;
  op: "add";
  path: string;
  value: unknown;
};
```

Defined in: [operations/helpers.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L55)

Add operation response
Causes Commerce to add the provided value to the provided path in the triggered event arguments.

## Properties

### instance?

```ts
optional instance: string;
```

Defined in: [operations/helpers.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L62)

Specifies the DataObject class name to create, based on the value and added to the provided path.

---

### op

```ts
op: "add";
```

Defined in: [operations/helpers.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L56)

---

### path

```ts
path: string;
```

Defined in: [operations/helpers.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L58)

Specifies the path at which the value should be added to the triggered event arguments.

---

### value

```ts
value: unknown;
```

Defined in: [operations/helpers.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L60)

Specifies the value to be added. This can be a single value or in an array format.
