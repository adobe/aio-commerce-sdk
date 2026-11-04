# `accepted`

```ts
const accepted: <TBody>(
  payload?:
    | string
    | {
        body?: TBody;
        headers?: HeadersRecord;
      },
) => SuccessResponse<TBody>;
```

Defined in: [responses/presets.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-core/source/responses/presets.ts#L76)

Creates a success response with the HTTP status code 202.
See [buildSuccessResponse](../functions/buildSuccessResponse.md) for details on the response payload.

## Type Parameters

| Type Parameter                                                         | Default type |
| ---------------------------------------------------------------------- | ------------ |
| <a id="type-parameter-__typetbody"></a> `TBody` _extends_ `BodyRecord` | `BodyRecord` |

## Parameters

| Parameter  | Type                                                                |
| ---------- | ------------------------------------------------------------------- |
| `payload?` | \| `string` \| \{ `body?`: `TBody`; `headers?`: `HeadersRecord`; \} |

## Returns

[`SuccessResponse`](../type-aliases/SuccessResponse.md)\<`TBody`\>
