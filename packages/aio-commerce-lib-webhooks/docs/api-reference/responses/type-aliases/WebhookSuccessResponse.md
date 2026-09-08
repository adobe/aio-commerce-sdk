# `WebhookSuccessResponse`

```ts
type WebhookSuccessResponse = Omit<SuccessResponse, "body" | "statusCode"> & {
  body?: WebhookOperationResponse | WebhookOperationResponse[];
  statusCode: typeof HTTP_OK;
};
```

Defined in: [responses/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-webhooks/source/responses/types.ts#L26)

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
