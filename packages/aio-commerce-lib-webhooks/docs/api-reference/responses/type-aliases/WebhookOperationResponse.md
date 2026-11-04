# `WebhookOperationResponse\<TValue = `unknown`\>`

```ts
type WebhookOperationResponse<TValue = unknown> =
  | SuccessOperation
  | ExceptionOperation
  | AddOperation<TValue>
  | ReplaceOperation<TValue>
  | RemoveOperation;
```

Defined in: [responses/operations/types.ts:78](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-webhooks/source/responses/operations/types.ts#L78)

Union type representing any webhook operation response

## Type Parameters

| Type Parameter                              | Default type | Description                                                                   |
| ------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| <a id="type-parameter-tvalue"></a> `TValue` | `unknown`    | The type of the value for operations that carry a value (defaults to unknown) |
