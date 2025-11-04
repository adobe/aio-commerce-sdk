# `StandardActionResponse\<T\>`

```ts
type StandardActionResponse<T> = {
  body:
    | T
    | {
        error: ActionErrorResponse;
      };
  headers?: Record<string, string>;
  statusCode: number;
};
```

Defined in: [utils/api-interface.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L19)

## Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | `unknown`    |

## Properties

### body

```ts
body:
  | T
  | {
  error: ActionErrorResponse;
};
```

Defined in: [utils/api-interface.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L21)

---

### headers?

```ts
optional headers: Record<string, string>;
```

Defined in: [utils/api-interface.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L22)

---

### statusCode

```ts
statusCode: number;
```

Defined in: [utils/api-interface.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L20)
