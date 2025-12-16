# `internalServerError()`

```ts
const internalServerError: (
  payload:
    | string
    | {
        body: BodyRecordWithMessage;
        headers?: HeadersRecord;
      },
) => ErrorResponse<BodyRecordWithMessage, HeadersRecord>;
```

Defined in: [responses/presets.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-core/source/responses/presets.ts#L96)

Creates an error response with the HTTP status code 500.
See [buildErrorResponse](../functions/buildErrorResponse.md) for details on the response payload.

## Parameters

| Parameter | Type                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `payload` | \| `string` \| \{ `body`: `BodyRecordWithMessage`; `headers?`: `HeadersRecord`; \} |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`BodyRecordWithMessage`, `HeadersRecord`\>
