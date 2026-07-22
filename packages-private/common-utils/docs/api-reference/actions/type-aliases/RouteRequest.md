# `RouteRequest\<TParams, TBody, TQuery\>`

```ts
type RouteRequest<TParams, TBody, TQuery> = {
  body: TBody;
  headers: Record<string, string>;
  method: HttpMethod;
  params: TParams;
  path: string;
  query: TQuery;
};
```

Defined in: [actions/http/types.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L96)

Represents an incoming route request with typed parameters, body, and query.

## Type Parameters

| Type Parameter | Description                                    |
| -------------- | ---------------------------------------------- |
| `TParams`      | Type of route parameters (extracted from path) |
| `TBody`        | Type of request body                           |
| `TQuery`       | Type of query parameters                       |

## Properties

### body

```ts
body: TBody;
```

Defined in: [actions/http/types.ts:98](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L98)

Parsed request body

---

### headers

```ts
headers: Record<string, string>;
```

Defined in: [actions/http/types.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L101)

HTTP headers from the request

---

### method

```ts
method: HttpMethod;
```

Defined in: [actions/http/types.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L104)

HTTP method used for the request

---

### params

```ts
params: TParams;
```

Defined in: [actions/http/types.ts:106](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L106)

Route parameters extracted from the URL path

---

### path

```ts
path: string;
```

Defined in: [actions/http/types.ts:109](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L109)

The matched path

---

### query

```ts
query: TQuery;
```

Defined in: [actions/http/types.ts:112](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/actions/http/types.ts#L112)

Query string parameters
