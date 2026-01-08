# `RemoveOperation`

```ts
type RemoveOperation = {
  op: "remove";
  path: string;
};
```

Defined in: [operations/helpers.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L83)

Remove operation response
Causes Commerce to remove a value or node in triggered event arguments by the provided path.

## Properties

### op

```ts
op: "remove";
```

Defined in: [operations/helpers.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L84)

---

### path

```ts
path: string;
```

Defined in: [operations/helpers.ts:86](https://github.com/adobe/aio-commerce-sdk/blob/74703f35a9a13c231e6cf99701fbf18db784e8ec/packages/aio-commerce-lib-webhooks/source/operations/helpers.ts#L86)

Specifies the path at which the value should be removed.
