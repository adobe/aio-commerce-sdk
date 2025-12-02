# `ActionResponse\<TBody, THeaders\>`

```ts
type ActionResponse<TBody, THeaders> =
  | SuccessResponse<TBody, THeaders>
  | ErrorResponse<TBody, THeaders>;
```

Defined in: [responses/helpers.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-core/source/responses/helpers.ts#L61)

Union type representing either a successful or error response from a runtime action

## Type Parameters

| Type Parameter                            | Default type            | Description                    |
| ----------------------------------------- | ----------------------- | ------------------------------ |
| `TBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | Response/error body properties |
| `THeaders` _extends_ `HeadersRecord`      | `HeadersRecord`         | Custom response headers        |
