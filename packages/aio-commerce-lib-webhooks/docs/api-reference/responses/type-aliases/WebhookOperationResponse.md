# `WebhookOperationResponse\<TValue\>`

```ts
type WebhookOperationResponse<TValue> =
  | SuccessOperation
  | ExceptionOperation
  | AddOperation<TValue>
  | ReplaceOperation<TValue>
  | RemoveOperation;
```

Defined in: [responses/operations/types.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L78)

Union type representing any webhook operation response

## Type Parameters

| Type Parameter | Default type | Description                                                                   |
| -------------- | ------------ | ----------------------------------------------------------------------------- |
| `TValue`       | `unknown`    | The type of the value for operations that carry a value (defaults to unknown) |
