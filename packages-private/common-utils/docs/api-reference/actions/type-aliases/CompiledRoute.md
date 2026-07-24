# `CompiledRoute`

```ts
type CompiledRoute = {
  body?: StandardSchemaV1;
  handler: (
    req: RouteRequest<any, any, any>,
    ctx: any,
  ) => Promisable<ActionResponse>;
  keys: string[];
  method: HttpMethod;
  params?: StandardSchemaV1;
  pattern: RegExp;
  query?: StandardSchemaV1;
};
```

Defined in: [actions/http/types.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L116)

Internal compiled route representation used by the router.

## Properties

### body?

```ts
optional body?: StandardSchemaV1;
```

Defined in: [actions/http/types.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L118)

Optional schema for validating request body

---

### handler

```ts
handler: (req: RouteRequest<any, any, any>, ctx: any) =>
  Promisable<ActionResponse>;
```

Defined in: [actions/http/types.ts:121](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L121)

Route handler function

#### Parameters

| Parameter | Type                                                     |
| --------- | -------------------------------------------------------- |
| `req`     | [`RouteRequest`](RouteRequest.md)\<`any`, `any`, `any`\> |
| `ctx`     | `any`                                                    |

#### Returns

`Promisable`\<`ActionResponse`\>

---

### keys

```ts
keys: string[];
```

Defined in: [actions/http/types.ts:129](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L129)

Extracted parameter names from the path

---

### method

```ts
method: HttpMethod;
```

Defined in: [actions/http/types.ts:131](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L131)

HTTP method for this route

---

### params?

```ts
optional params?: StandardSchemaV1;
```

Defined in: [actions/http/types.ts:134](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L134)

Optional schema for validating route parameters

---

### pattern

```ts
pattern: RegExp;
```

Defined in: [actions/http/types.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L137)

Compiled regex pattern for path matching

---

### query?

```ts
optional query?: StandardSchemaV1;
```

Defined in: [actions/http/types.ts:140](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L140)

Optional schema for validating query parameters
