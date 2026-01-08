# `ok()`

```ts
const ok: (
  payload?:
    | string
    | {
        body?: BodyRecord;
        headers?: HeadersRecord;
      },
) => SuccessResponse<BodyRecord, HeadersRecord>;
```

Defined in: [responses/presets.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-core/source/responses/presets.ts#L52)

Creates a success response with the HTTP status code 200.
See [buildSuccessResponse](../functions/buildSuccessResponse.md) for details on the response payload.

## Parameters

| Parameter  | Type                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| `payload?` | \| `string` \| \{ `body?`: `BodyRecord`; `headers?`: `HeadersRecord`; \} |

## Returns

[`SuccessResponse`](../type-aliases/SuccessResponse.md)\<`BodyRecord`, `HeadersRecord`\>
