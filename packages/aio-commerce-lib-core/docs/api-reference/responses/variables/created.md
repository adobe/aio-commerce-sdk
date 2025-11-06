# `created()`

```ts
const created: (
  payload?:
    | string
    | {
        body?: BodyRecord;
        headers?: HeadersRecord;
      },
) => SuccessResponse<BodyRecord, HeadersRecord>;
```

Defined in: [responses/presets.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-core/source/responses/presets.ts#L57)

Creates a success response with the HTTP status code 201.
See [buildSuccessResponse](../functions/buildSuccessResponse.md) for details on the response payload.

## Parameters

| Parameter  | Type                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| `payload?` | \| `string` \| \{ `body?`: `BodyRecord`; `headers?`: `HeadersRecord`; \} |

## Returns

[`SuccessResponse`](../type-aliases/SuccessResponse.md)\<`BodyRecord`, `HeadersRecord`\>
