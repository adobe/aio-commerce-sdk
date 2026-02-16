# `CompiledRoute`

Defined in: [actions/http/types.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L116)

Internal compiled route representation used by the router.

## Properties

### body?

```ts
optional body: StandardSchemaV1<unknown, unknown>;
```

Defined in: [actions/http/types.ts:130](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L130)

Optional schema for validating request body

---

### handler()

```ts
handler: (req: RouteRequest<any, any, any>, ctx: any) =>
  Promisable<ActionResponse>;
```

Defined in: [actions/http/types.ts:136](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L136)

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

Defined in: [actions/http/types.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L124)

Extracted parameter names from the path

---

### method

```ts
method: HttpMethod;
```

Defined in: [actions/http/types.ts:118](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L118)

HTTP method for this route

---

### params?

```ts
optional params: StandardSchemaV1<unknown, unknown>;
```

Defined in: [actions/http/types.ts:127](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L127)

Optional schema for validating route parameters

---

### pattern

```ts
pattern: RegExp;
```

Defined in: [actions/http/types.ts:121](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L121)

Compiled regex pattern for path matching

---

### query?

```ts
optional query: StandardSchemaV1<unknown, unknown>;
```

Defined in: [actions/http/types.ts:133](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L133)

Optional schema for validating query parameters
