# `errorGridResponse()`

```ts
function errorGridResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<GridErrorBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/responses/presets.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/grid-columns/responses/presets.ts#L63)

Builds an error response for a grid column handler with the given HTTP status code.

Commerce uses the HTTP status code to distinguish success from failure.

## Parameters

| Parameter      | Type     | Description                                                   |
| -------------- | -------- | ------------------------------------------------------------- |
| `statusCode`   | `number` | The HTTP status code to return.                               |
| `errorMessage` | `string` | Error message included in the response body as `{ message }`. |

## Returns

`ErrorResponse`\<[`GridErrorBody`](../type-aliases/GridErrorBody.md)\>

## Example

```ts
return errorGridResponse(500, "Could not reach inventory service");
```
