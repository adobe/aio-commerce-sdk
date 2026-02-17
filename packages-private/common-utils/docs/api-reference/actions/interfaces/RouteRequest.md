# `RouteRequest\<TParams, TBody, TQuery\>`

Defined in: [actions/http/types.ts:95](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L95)

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

Defined in: [actions/http/types.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L100)

Parsed request body

---

### headers

```ts
headers: Record<string, string>;
```

Defined in: [actions/http/types.ts:106](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L106)

HTTP headers from the request

---

### method

```ts
method: HttpMethod;
```

Defined in: [actions/http/types.ts:109](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L109)

HTTP method used for the request

---

### params

```ts
params: TParams;
```

Defined in: [actions/http/types.ts:97](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L97)

Route parameters extracted from the URL path

---

### path

```ts
path: string;
```

Defined in: [actions/http/types.ts:112](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L112)

The matched path

---

### query

```ts
query: TQuery;
```

Defined in: [actions/http/types.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages-private/common-utils/source/actions/http/types.ts#L103)

Query string parameters
