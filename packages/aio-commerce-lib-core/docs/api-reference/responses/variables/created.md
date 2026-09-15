# `created`

```ts
const created: <TBody>(
  payload?:
    | string
    | {
        body?: TBody;
        headers?: HeadersRecord;
      },
) => SuccessResponse<TBody>;
```

Defined in: [responses/presets.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-core/source/responses/presets.ts#L70)

Creates a success response with the HTTP status code 201.
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
