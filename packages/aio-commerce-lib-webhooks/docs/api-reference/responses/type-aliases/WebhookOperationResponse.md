# `WebhookOperationResponse\<TValue = `unknown`\>`

```ts
type WebhookOperationResponse<TValue = unknown> =
  | SuccessOperation
  | ExceptionOperation
  | AddOperation<TValue>
  | ReplaceOperation<TValue>
  | RemoveOperation;
```

Defined in: [responses/operations/types.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L78)

Union type representing any webhook operation response

## Type Parameters

| Type Parameter | Default type | Description                                                                   |
| -------------- | ------------ | ----------------------------------------------------------------------------- |
| `TValue`       | `unknown`    | The type of the value for operations that carry a value (defaults to unknown) |
