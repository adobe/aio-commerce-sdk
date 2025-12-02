# `ErrorResponse\<TBody, THeaders\>`

```ts
type ErrorResponse<TBody, THeaders> = {
  error: ResponsePayload<TBody, THeaders>;
  type: "error";
};
```

Defined in: [responses/helpers.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-core/source/responses/helpers.ts#L36)

Represents an error response from a runtime action

## Type Parameters

| Type Parameter                            | Default type            | Description                                                        |
| ----------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| `TBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | Additional error body properties beyond the required message field |
| `THeaders` _extends_ `HeadersRecord`      | `HeadersRecord`         | Custom response headers                                            |

## Properties

### error

```ts
error: ResponsePayload<TBody, THeaders>;
```

Defined in: [responses/helpers.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-core/source/responses/helpers.ts#L41)

---

### type

```ts
type: "error";
```

Defined in: [responses/helpers.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-core/source/responses/helpers.ts#L40)
