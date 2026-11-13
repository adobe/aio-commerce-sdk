# `invoiceViewButtonErrorResponse()`

```ts
function invoiceViewButtonErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<InvoiceViewButtonErrorBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/invoice-view-buttons/presets.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/invoice-view-buttons/presets.ts#L61)

Builds an error response for an invoice view-button worker.

## Parameters

| Parameter      | Type     | Description                                |
| -------------- | -------- | ------------------------------------------ |
| `statusCode`   | `number` | The HTTP status code to return.            |
| `errorMessage` | `string` | The message included in the response body. |

## Returns

`ErrorResponse`\<[`InvoiceViewButtonErrorBody`](../type-aliases/InvoiceViewButtonErrorBody.md)\>

## Example

```ts
return invoiceViewButtonErrorResponse(500, "Could not export the invoice");
```
