# `orderViewButtonErrorResponse()`

```ts
function orderViewButtonErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<OrderViewButtonErrorBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts#L84)

Builds an error response for a worker order view button handler with the given HTTP status code.

Commerce uses the HTTP status code to distinguish success from failure.

## Parameters

| Parameter      | Type     | Description                                                   |
| -------------- | -------- | ------------------------------------------------------------- |
| `statusCode`   | `number` | The HTTP status code to return.                               |
| `errorMessage` | `string` | Error message included in the response body as `{ message }`. |

## Returns

`ErrorResponse`\<[`OrderViewButtonErrorBody`](../type-aliases/OrderViewButtonErrorBody.md)\>

## Example

```ts
return orderViewButtonErrorResponse(500, "Could not reach inventory service");
```
