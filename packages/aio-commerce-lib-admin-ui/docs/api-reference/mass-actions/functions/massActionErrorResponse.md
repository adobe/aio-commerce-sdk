# `massActionErrorResponse()`

```ts
function massActionErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<MassActionErrorBody>;
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts:80](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-admin-ui/source/mass-actions/worker/presets.ts#L80)

Builds an error response for a worker mass action with the given HTTP status code.

## Parameters

| Parameter      | Type     | Description                                                   |
| -------------- | -------- | ------------------------------------------------------------- |
| `statusCode`   | `number` | The HTTP status code to return.                               |
| `errorMessage` | `string` | Error message included in the response body as `{ message }`. |

## Returns

`ErrorResponse`\<[`MassActionErrorBody`](../type-aliases/MassActionErrorBody.md)\>

## Example

```ts
return massActionErrorResponse(422, "Request entity is unprocessable");
```
