# `WebhookSuccessResponse`

```ts
type WebhookSuccessResponse = Omit<SuccessResponse, "body" | "statusCode"> & {
  body?: WebhookOperationResponse | WebhookOperationResponse[];
  statusCode: typeof HTTP_OK;
};
```

Defined in: [responses/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/responses/types.ts#L26)

Successful SDK response containing webhook operation response body data.

## Type Declaration

### body?

```ts
body?:
  | WebhookOperationResponse
  | WebhookOperationResponse[];
```

### statusCode

```ts
statusCode: typeof HTTP_OK;
```
