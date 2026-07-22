# `orderViewButtonErrorResponse()`

```ts
function orderViewButtonErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<OrderViewButtonErrorBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts:83](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/order-view-buttons/presets.ts#L83)

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
