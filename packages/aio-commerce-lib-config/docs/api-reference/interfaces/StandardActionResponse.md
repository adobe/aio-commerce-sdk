# `StandardActionResponse\<T\>`

Defined in: [utils/api-interface.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L19)

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | `any`        |

## Properties

### body

```ts
body:
  | T
  | {
  error: ActionErrorResponse;
};
```

Defined in: [utils/api-interface.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L21)

---

### headers?

```ts
optional headers: Record<string, string>;
```

Defined in: [utils/api-interface.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L22)

---

### statusCode

```ts
statusCode: number;
```

Defined in: [utils/api-interface.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L20)
