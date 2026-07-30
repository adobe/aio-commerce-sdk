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

Defined in: [responses/presets.ts:64](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-core/source/responses/presets.ts#L64)

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
