# `WebhookOperationResponse\<TValue = `unknown`\>`

```ts
type WebhookOperationResponse<TValue = unknown> =
  | SuccessOperation
  | ExceptionOperation
  | AddOperation<TValue>
  | ReplaceOperation<TValue>
  | RemoveOperation;
```

Defined in: [responses/operations/types.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L78)

Union type representing any webhook operation response

## Type Parameters

| Type Parameter                              | Default type | Description                                                                   |
| ------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| <a id="type-parameter-tvalue"></a> `TValue` | `unknown`    | The type of the value for operations that carry a value (defaults to unknown) |
