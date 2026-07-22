# `WebhookSuccessResponse`

```ts
type WebhookSuccessResponse = Omit<SuccessResponse, "body" | "statusCode"> & {
  body?: WebhookOperationResponse | WebhookOperationResponse[];
  statusCode: typeof HTTP_OK;
};
```

Defined in: [responses/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-webhooks/source/responses/types.ts#L26)

Successful SDK response containing webhook operation response body data.

## Type Declaration

### body?

```ts
optional body?:
  | WebhookOperationResponse
  | WebhookOperationResponse[];
```

### statusCode

```ts
statusCode: typeof HTTP_OK;
```
