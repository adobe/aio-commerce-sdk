# `WebhookOperationResponse\<TValue\>`

```ts
type WebhookOperationResponse<TValue> =
  | SuccessOperation
  | ExceptionOperation
  | AddOperation<TValue>
  | ReplaceOperation<TValue>
  | RemoveOperation;
```

Defined in: [responses/operations/types.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L78)

Union type representing any webhook operation response

## Type Parameters

| Type Parameter | Default type | Description                                                                   |
| -------------- | ------------ | ----------------------------------------------------------------------------- |
| `TValue`       | `unknown`    | The type of the value for operations that carry a value (defaults to unknown) |
