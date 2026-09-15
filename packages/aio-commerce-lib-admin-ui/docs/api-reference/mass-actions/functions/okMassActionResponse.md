# `okMassActionResponse()`

```ts
function okMassActionResponse(
  body?: MassActionResponseBody,
): SuccessResponse<MassActionResponseBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts#L63)

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
