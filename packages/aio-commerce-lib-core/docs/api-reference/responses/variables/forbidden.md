# `forbidden()`

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

Defined in: [responses/presets.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-core/source/responses/presets.ts#L84)

Creates an error response with the HTTP status code 403.
See [buildErrorResponse](../functions/buildErrorResponse.md) for details on the response payload.

## Parameters

| Parameter | Type                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `payload` | \| `string` \| \{ `body`: `BodyRecordWithMessage`; `headers?`: `HeadersRecord`; \} |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`BodyRecordWithMessage`, `HeadersRecord`\>
