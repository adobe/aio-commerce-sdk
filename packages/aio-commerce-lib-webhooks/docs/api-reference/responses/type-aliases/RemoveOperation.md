# `RemoveOperation`

```ts
type RemoveOperation = {
  op: "remove";
  path: string;
};
```

Defined in: [responses/operations/types.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L67)

Remove operation response
Causes Commerce to remove a value or node in triggered event arguments by the provided path.

## Properties

### op

```ts
op: "remove";
```

Defined in: [responses/operations/types.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L68)

---

### path

```ts
path: string;
```

Defined in: [responses/operations/types.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L70)

Specifies the path at which the value should be removed.
