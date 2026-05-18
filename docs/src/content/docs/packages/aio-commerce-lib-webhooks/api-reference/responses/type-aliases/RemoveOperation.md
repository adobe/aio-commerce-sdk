---
title: "RemoveOperation"
editUrl: false
prev: false
next: false
---

```ts
type RemoveOperation = {
  op: "remove";
  path: string;
};
```

Defined in: [responses/operations/types.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L67)

Remove operation response
Causes Commerce to remove a value or node in triggered event arguments by the provided path.

## Properties

### op

```ts
op: "remove";
```

Defined in: [responses/operations/types.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L68)

---

### path

```ts
path: string;
```

Defined in: [responses/operations/types.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L70)

Specifies the path at which the value should be removed.
