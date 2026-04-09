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

Defined in: [responses/presets.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-core/source/responses/presets.ts#L100)

Creates an error response with the HTTP status code 403.
See [buildErrorResponse](../functions/buildErrorResponse.md) for details on the response payload.

## Parameters

| Parameter | Type                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `payload` | \| `string` \| \{ `body`: `BodyRecordWithMessage`; `headers?`: `HeadersRecord`; \} |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`BodyRecordWithMessage`, `HeadersRecord`\>
