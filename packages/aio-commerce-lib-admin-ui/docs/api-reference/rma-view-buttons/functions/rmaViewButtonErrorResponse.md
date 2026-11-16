# `rmaViewButtonErrorResponse()`

```ts
function rmaViewButtonErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<RmaViewButtonErrorBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/rma-view-buttons/presets.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/rma-view-buttons/presets.ts#L61)

Builds an error response for a return view-button worker.

## Parameters

| Parameter      | Type     | Description                                |
| -------------- | -------- | ------------------------------------------ |
| `statusCode`   | `number` | The HTTP status code to return.            |
| `errorMessage` | `string` | The message included in the response body. |

## Returns

`ErrorResponse`\<[`RmaViewButtonErrorBody`](../type-aliases/RmaViewButtonErrorBody.md)\>

## Example

```ts
return rmaViewButtonErrorResponse(500, "Could not approve the return");
```
