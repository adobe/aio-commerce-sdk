# `ActionResponse\<TSuccessBody *extends* `BodyRecord`=`BodyRecord`, TErrorBody *extends* `BodyRecordWithMessage`=`BodyRecordWithMessage`, THeaders *extends* `HeadersRecord`=`HeadersRecord`\>`

```ts
type ActionResponse<
  TSuccessBody extends BodyRecord = BodyRecord,
  TErrorBody extends BodyRecordWithMessage = BodyRecordWithMessage,
  THeaders extends HeadersRecord = HeadersRecord,
> =
  SuccessResponse<TSuccessBody, THeaders> | ErrorResponse<TErrorBody, THeaders>;
```

Defined in: [responses/helpers.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-core/source/responses/helpers.ts#L61)

Union type representing either a successful or error response from a runtime action

## Type Parameters

| Type Parameter                                                                        | Default type            | Description             |
| ------------------------------------------------------------------------------------- | ----------------------- | ----------------------- |
| <a id="type-parameter-tsuccessbody"></a> `TSuccessBody` _extends_ `BodyRecord`        | `BodyRecord`            | -                       |
| <a id="type-parameter-terrorbody"></a> `TErrorBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` | -                       |
| <a id="type-parameter-theaders"></a> `THeaders` _extends_ `HeadersRecord`             | `HeadersRecord`         | Custom response headers |

## Template

**TBody**

Response/error body properties
