# `forbidden`

```ts
const forbidden: (
  payload:
    | string
    | {
        body: BodyRecordWithMessage;
        headers?: HeadersRecord;
      },
) => ErrorResponse<BodyRecordWithMessage, HeadersRecord>;
```

Defined in: [responses/presets.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-core/source/responses/presets.ts#L100)

Creates an error response with the HTTP status code 403.
See [buildErrorResponse](../functions/buildErrorResponse.md) for details on the response payload.

## Parameters

| Parameter | Type                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `payload` | \| `string` \| \{ `body`: `BodyRecordWithMessage`; `headers?`: `HeadersRecord`; \} |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`BodyRecordWithMessage`, `HeadersRecord`\>
