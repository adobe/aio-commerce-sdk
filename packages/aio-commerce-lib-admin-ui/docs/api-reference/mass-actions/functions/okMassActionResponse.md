# `okMassActionResponse()`

```ts
function okMassActionResponse(
  body?: MassActionResponseBody,
): SuccessResponse<MassActionResponseBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts#L63)

Builds an HTTP 200 success response for a worker mass action.

Commerce determines success from the HTTP status code. You may optionally
include any fields in `body` for your own logging or auditing purposes.

## Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `body`    | [`MassActionResponseBody`](../type-aliases/MassActionResponseBody.md) |

## Returns

`SuccessResponse`\<[`MassActionResponseBody`](../type-aliases/MassActionResponseBody.md)\>

## Example

```ts
return okMassActionResponse();
return okMassActionResponse({ exported: selectedIds.length });
```
