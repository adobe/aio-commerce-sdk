---
title: "accepted"
editUrl: false
prev: false
next: false
---

```ts
const accepted: (
  payload?:
    | string
    | {
        body?: BodyRecord;
        headers?: HeadersRecord;
      },
) => SuccessResponse<BodyRecord, HeadersRecord>;
```

Defined in: [responses/presets.ts:68](https://github.com/adobe/aio-commerce-sdk/blob/a9772d73e07fa247261408a7cf3d1aa439075a5e/packages/aio-commerce-lib-core/source/responses/presets.ts#L68)

Creates a success response with the HTTP status code 202.
See [buildSuccessResponse](../functions/buildSuccessResponse.md) for details on the response payload.

## Parameters

| Parameter  | Type                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| `payload?` | \| `string` \| \{ `body?`: `BodyRecord`; `headers?`: `HeadersRecord`; \} |

## Returns

[`SuccessResponse`](../type-aliases/SuccessResponse.md)\<`BodyRecord`, `HeadersRecord`\>
