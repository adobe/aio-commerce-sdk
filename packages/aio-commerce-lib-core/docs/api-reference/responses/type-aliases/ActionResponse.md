# `ActionResponse\<TSuccessBody, TErrorBody, THeaders\>`

```ts
type ActionResponse<TSuccessBody, TErrorBody, THeaders> =
  | SuccessResponse<TSuccessBody, THeaders>
  | ErrorResponse<TErrorBody, THeaders>;
```

Defined in: [responses/helpers.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-core/source/responses/helpers.ts#L61)

Union type representing either a successful or error response from a runtime action

## Type Parameters

| Type Parameter                                 | Default type            | Description             |
| ---------------------------------------------- | ----------------------- | ----------------------- |
| `TSuccessBody` _extends_ `BodyRecord`          | `BodyRecord`            | -                       |
| `TErrorBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | -                       |
| `THeaders` _extends_ `HeadersRecord`           | `HeadersRecord`         | Custom response headers |

## Template

Response/error body properties
