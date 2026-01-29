# `ApiClientRecord\<TClient, TFunctions\>`

```ts
type ApiClientRecord<TClient, TFunctions> = {
  [K in keyof TFunctions]: TFunctions[K] extends ApiFunction<
    TClient,
    infer Args,
    infer Result
  >
    ? (args: Args) => Result
    : never;
};
```

Defined in: [aio-commerce-lib-api/source/lib/api-client.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/api-client.ts#L23)

A client that bounds a set of [ApiFunction](ApiFunction.md) to their HTTP clients.

## Type Parameters

| Type Parameter                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- |
| `TClient` _extends_ `HttpClientBase`\<`unknown`\>                                                                 |
| `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](ApiFunction.md)\<`TClient`, `unknown`[], `unknown`\>\> |
