# `creditMemoViewButtonErrorResponse()`

```ts
function creditMemoViewButtonErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<CreditMemoViewButtonErrorBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/credit-memo-view-buttons/presets.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/credit-memo-view-buttons/presets.ts#L61)

Builds an error response for a credit memo view-button worker.

## Parameters

| Parameter      | Type     | Description                                |
| -------------- | -------- | ------------------------------------------ |
| `statusCode`   | `number` | The HTTP status code to return.            |
| `errorMessage` | `string` | The message included in the response body. |

## Returns

`ErrorResponse`\<[`CreditMemoViewButtonErrorBody`](../type-aliases/CreditMemoViewButtonErrorBody.md)\>

## Example

```ts
return creditMemoViewButtonErrorResponse(
  500,
  "Could not refund the credit memo",
);
```
