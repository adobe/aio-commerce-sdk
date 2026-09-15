# `internalServerError`

```ts
const internalServerError: <TBody>(
  payload:
    | string
    | {
        body: TBody;
        headers?: HeadersRecord;
      },
) => ErrorResponse<TBody>;
```

Defined in: [responses/presets.ts:134](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-core/source/responses/presets.ts#L134)

Creates an error response with the HTTP status code 500.
See [buildErrorResponse](../functions/buildErrorResponse.md) for details on the response payload.

## Type Parameters

| Type Parameter                            | Default type            |
| ----------------------------------------- | ----------------------- |
| `TBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` |

## Parameters

| Parameter | Type                                                               |
| --------- | ------------------------------------------------------------------ |
| `payload` | \| `string` \| \{ `body`: `TBody`; `headers?`: `HeadersRecord`; \} |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`TBody`\>
