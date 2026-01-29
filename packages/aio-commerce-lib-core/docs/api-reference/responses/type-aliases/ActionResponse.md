# `ActionResponse\<TBody, THeaders\>`

```ts
type ActionResponse<TBody, THeaders> =
  | SuccessResponse<TBody, THeaders>
  | ErrorResponse<TBody, THeaders>;
```

Defined in: [responses/helpers.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/responses/helpers.ts#L61)

Union type representing either a successful or error response from a runtime action

## Type Parameters

| Type Parameter                            | Default type            | Description                    |
| ----------------------------------------- | ----------------------- | ------------------------------ |
| `TBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | Response/error body properties |
| `THeaders` _extends_ `HeadersRecord`      | `HeadersRecord`         | Custom response headers        |
