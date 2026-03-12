# `RouteRequest\<TParams, TBody, TQuery\>`

Defined in: [actions/http/types.ts:95](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/actions/http/types.ts#L95)

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

Defined in: [actions/http/types.ts:97](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/actions/http/types.ts#L97)

Parsed request body

---

### headers

```ts
headers: Record<string, string>;
```

Defined in: [actions/http/types.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/actions/http/types.ts#L100)

HTTP headers from the request

---

### method

```ts
method: HttpMethod;
```

Defined in: [actions/http/types.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/actions/http/types.ts#L103)

HTTP method used for the request

---

### params

```ts
params: TParams;
```

Defined in: [actions/http/types.ts:105](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/actions/http/types.ts#L105)

Route parameters extracted from the URL path

---

### path

```ts
path: string;
```

Defined in: [actions/http/types.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/actions/http/types.ts#L108)

The matched path

---

### query

```ts
query: TQuery;
```

Defined in: [actions/http/types.ts:111](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages-private/common-utils/source/actions/http/types.ts#L111)

Query string parameters
