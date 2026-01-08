# `ReplaceOperation`

```ts
type ReplaceOperation = {
  instance?: string;
  op: "replace";
  path: string;
  value: unknown;
};
```

Defined in: [operations/helpers.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L69)

Replace operation response
Causes Commerce to replace a value in triggered event arguments for the provided path.

## Properties

### instance?

```ts
optional instance: string;
```

Defined in: [operations/helpers.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L76)

Specifies the DataObject class name to create, based on the value and added to the provided path.

---

### op

```ts
op: "replace";
```

Defined in: [operations/helpers.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L70)

---

### path

```ts
path: string;
```

Defined in: [operations/helpers.ts:72](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L72)

Specifies the path at which the value should be replaced with the provided value.

---

### value

```ts
value: unknown;
```

Defined in: [operations/helpers.ts:74](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L74)

Specifies the replacement value. This can be a single value or in an array format.
