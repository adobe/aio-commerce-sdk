# `ActionResponse\<TBody, THeaders\>`

```ts
type ActionResponse<TBody, THeaders> =
  | SuccessResponse<TBody, THeaders>
  | ErrorResponse<TBody, THeaders>;
```

Defined in: [responses/helpers.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-core/source/responses/helpers.ts#L61)

Union type representing either a successful or error response from a runtime action

## Type Parameters

| Type Parameter                            | Default type            | Description                    |
| ----------------------------------------- | ----------------------- | ------------------------------ |
| `TBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | Response/error body properties |
| `THeaders` _extends_ `HeadersRecord`      | `HeadersRecord`         | Custom response headers        |
