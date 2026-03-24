# `CompiledRoute`

Defined in: [actions/http/types.ts:115](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L115)

Internal compiled route representation used by the router.

## Properties

### body?

```ts
optional body: StandardSchemaV1<unknown, unknown>;
```

Defined in: [actions/http/types.ts:117](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L117)

Optional schema for validating request body

---

### handler()

```ts
handler: (req: RouteRequest<any, any, any>, ctx: any) =>
  Promisable<ActionResponse>;
```

Defined in: [actions/http/types.ts:120](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L120)

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

Defined in: [actions/http/types.ts:128](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L128)

Extracted parameter names from the path

---

### method

```ts
method: HttpMethod;
```

Defined in: [actions/http/types.ts:130](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L130)

HTTP method for this route

---

### params?

```ts
optional params: StandardSchemaV1<unknown, unknown>;
```

Defined in: [actions/http/types.ts:133](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L133)

Optional schema for validating route parameters

---

### pattern

```ts
pattern: RegExp;
```

Defined in: [actions/http/types.ts:136](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L136)

Compiled regex pattern for path matching

---

### query?

```ts
optional query: StandardSchemaV1<unknown, unknown>;
```

Defined in: [actions/http/types.ts:139](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages-private/common-utils/source/actions/http/types.ts#L139)

Optional schema for validating query parameters
