# `SuccessResponse\<TBody, THeaders\>`

```ts
type SuccessResponse<TBody, THeaders> = ResponsePayload<TBody, THeaders> & {
  type: "success";
};
```

Defined in: [responses/helpers.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-core/source/responses/helpers.ts#L49)

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
