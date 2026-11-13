# `unauthorized`

```ts
const unauthorized: <TBody>(
  payload:
    | string
    | {
        body: TBody;
        headers?: HeadersRecord;
      },
) => ErrorResponse<TBody>;
```

Defined in: [responses/presets.ts:102](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-core/source/responses/presets.ts#L102)

Creates an error response with the HTTP status code 401.
See [buildErrorResponse](../functions/buildErrorResponse.md) for details on the response payload.

## Type Parameters

| Type Parameter                                                                    | Default type            |
| --------------------------------------------------------------------------------- | ----------------------- |
| <a id="type-parameter-__typetbody"></a> `TBody` _extends_ `BodyRecordWithMessage` | `BodyRecordWithMessage` |

## Parameters

| Parameter | Type                                                               |
| --------- | ------------------------------------------------------------------ |
| `payload` | \| `string` \| \{ `body`: `TBody`; `headers?`: `HeadersRecord`; \} |

## Returns

[`ErrorResponse`](../type-aliases/ErrorResponse.md)\<`TBody`\>
