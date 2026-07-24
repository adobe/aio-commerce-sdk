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

Defined in: [aio-commerce-lib-api/source/lib/api-client.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/lib/api-client.ts#L23)

A client that bounds a set of [ApiFunction](ApiFunction.md) to their HTTP clients.

## Type Parameters

| Type Parameter                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- |
| `TClient` _extends_ `HttpClientBase`\<`unknown`\>                                                                 |
| `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](ApiFunction.md)\<`TClient`, `unknown`[], `unknown`\>\> |
