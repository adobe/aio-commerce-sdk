# `okMassActionResponse()`

```ts
function okMassActionResponse(
  body?: MassActionResponseBody,
): SuccessResponse<MassActionResponseBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts#L63)

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
