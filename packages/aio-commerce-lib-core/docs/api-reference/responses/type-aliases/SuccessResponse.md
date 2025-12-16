# `SuccessResponse\<TBody, THeaders\>`

```ts
type SuccessResponse<TBody, THeaders> = ResponsePayload<TBody, THeaders> & {
  type: "success";
};
```

Defined in: [responses/helpers.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-core/source/responses/helpers.ts#L49)

Represents a successful response from a runtime action

## Type Declaration

### type

```ts
type: "success";
```

## Type Parameters

| Type Parameter                       | Default type    | Description              |
| ------------------------------------ | --------------- | ------------------------ |
| `TBody` _extends_ `BodyRecord`       | `BodyRecord`    | Response body properties |
| `THeaders` _extends_ `HeadersRecord` | `HeadersRecord` | Custom response headers  |
