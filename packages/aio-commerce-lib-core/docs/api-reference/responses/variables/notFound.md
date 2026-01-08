# `notFound()`

```ts
const notFound: (
  payload:
    | string
    | {
        body: BodyRecordWithMessage;
        headers?: HeadersRecord;
      },
) => ErrorResponse<BodyRecordWithMessage, HeadersRecord>;
```

Defined in: [responses/presets.ts:90](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-core/source/responses/presets.ts#L90)

Creates an error response with the HTTP status code 404.
See [buildErrorResponse](../functions/buildErrorResponse.md) for details on the response payload.

## Parameters

| Parameter | Type                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `payload` | \| `string` \| \{ `body`: `BodyRecordWithMessage`; `headers?`: `HeadersRecord`; \} |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`BodyRecordWithMessage`, `HeadersRecord`\>
