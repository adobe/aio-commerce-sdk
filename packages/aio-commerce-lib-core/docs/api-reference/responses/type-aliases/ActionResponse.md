# `ActionResponse\<TSuccessBody *extends* `BodyRecord`=`BodyRecord`, TErrorBody *extends* `BodyRecordWithMessage`=`BodyRecordWithMessage`, THeaders *extends* `HeadersRecord`=`HeadersRecord`\>`

```ts
type ActionResponse<
  TSuccessBody extends BodyRecord = BodyRecord,
  TErrorBody extends BodyRecordWithMessage = BodyRecordWithMessage,
  THeaders extends HeadersRecord = HeadersRecord,
> =
  SuccessResponse<TSuccessBody, THeaders> | ErrorResponse<TErrorBody, THeaders>;
```

Defined in: [responses/helpers.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-core/source/responses/helpers.ts#L61)

Union type representing either a successful or error response from a runtime action

## Type Parameters

| Type Parameter                                 | Default type            | Description             |
| ---------------------------------------------- | ----------------------- | ----------------------- |
| `TSuccessBody` _extends_ `BodyRecord`          | `BodyRecord`            | -                       |
| `TErrorBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | -                       |
| `THeaders` _extends_ `HeadersRecord`           | `HeadersRecord`         | Custom response headers |

## Template

**TBody**

Response/error body properties
