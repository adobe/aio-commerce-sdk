# `methodNotAllowed`

```ts
const methodNotAllowed: <TBody>(
  payload:
    | string
    | {
        body: TBody;
        headers?: HeadersRecord;
      },
) => ErrorResponse<TBody>;
```

Defined in: [responses/presets.ts:120](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/responses/presets.ts#L120)

Creates an error response with the HTTP status code 405.
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
