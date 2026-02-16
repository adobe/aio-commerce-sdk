# `RuntimeActionParams`

```ts
type RuntimeActionParams = {
  [key: string]: unknown;
  __ow_body?: string;
  __ow_headers?: Record<string, string | undefined>;
  __ow_method?: HttpMethodLowercase;
  __ow_path?: string;
  __ow_query?: string;
};
```

Defined in: [params/types.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/params/types.ts#L33)

The type of the runtime action parameters.

## Indexable

```ts
[key: string]: unknown
```

## Properties

### \_\_ow_body?

```ts
optional __ow_body: string;
```

Defined in: [params/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/params/types.ts#L44)

If the runtime action is invoked via HTTP, this will be the request body entity, as a base64-encoded string when its content is binary or JSON object/array, or as a plain string otherwise

---

### \_\_ow_headers?

```ts
optional __ow_headers: Record<string, string | undefined>;
```

Defined in: [params/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/params/types.ts#L35)

If the runtime action is invoked via HTTP, this will be the headers of the request.

---

### \_\_ow_method?

```ts
optional __ow_method: HttpMethodLowercase;
```

Defined in: [params/types.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/params/types.ts#L38)

If the runtime action is invoked via HTTP, this will be the HTTP method of the request.

---

### \_\_ow_path?

```ts
optional __ow_path: string;
```

Defined in: [params/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/params/types.ts#L41)

If the runtime action is invoked via HTTP, this will be the unmatched path of the request (matching stops after consuming the action extension)

---

### \_\_ow_query?

```ts
optional __ow_query: string;
```

Defined in: [params/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/params/types.ts#L47)

If the runtime action is invoked via HTTP, this will be the query parameters of the request, as an unparsed string.
