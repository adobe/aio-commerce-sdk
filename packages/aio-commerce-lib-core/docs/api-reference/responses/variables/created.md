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

Defined in: [responses/presets.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-core/source/responses/presets.ts#L62)

Creates a success response with the HTTP status code 201.
See [buildSuccessResponse](../functions/buildSuccessResponse.md) for details on the response payload.

## Parameters

| Parameter  | Type                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| `payload?` | \| `string` \| \{ `body?`: `BodyRecord`; `headers?`: `HeadersRecord`; \} |

## Returns

[`SuccessResponse`](../type-aliases/SuccessResponse.md)\<`BodyRecord`, `HeadersRecord`\>
