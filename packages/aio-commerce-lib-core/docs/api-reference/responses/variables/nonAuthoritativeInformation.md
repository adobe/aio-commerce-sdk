# `nonAuthoritativeInformation`

```ts
const nonAuthoritativeInformation: <TBody>(
  payload?:
    | string
    | {
        body?: TBody;
        headers?: HeadersRecord;
      },
) => SuccessResponse<TBody>;
```

Defined in: [responses/presets.ts:82](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-core/source/responses/presets.ts#L82)

Creates a success response with the HTTP status code 203.
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
