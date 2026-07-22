# `ok`

```ts
const ok: <TBody>(
  payload?:
    | string
    | {
        body?: TBody;
        headers?: HeadersRecord;
      },
) => SuccessResponse<TBody>;
```

Defined in: [responses/presets.ts:64](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/responses/presets.ts#L64)

Creates a success response with the HTTP status code 200.
See [buildSuccessResponse](../functions/buildSuccessResponse.md) for details on the response payload.

## Type Parameters

| Type Parameter                 | Default type |
| ------------------------------ | ------------ |
| `TBody` _extends_ `BodyRecord` | `BodyRecord` |

## Parameters

| Parameter  | Type                                                                |
| ---------- | ------------------------------------------------------------------- |
| `payload?` | \| `string` \| \{ `body?`: `TBody`; `headers?`: `HeadersRecord`; \} |

## Returns

[`SuccessResponse`](../type-aliases/SuccessResponse.md)\<`TBody`\>
