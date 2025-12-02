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

Defined in: [packages/aio-commerce-lib-api/source/lib/api-client.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-api/source/lib/api-client.ts#L23)

A client that bounds a set of [ApiFunction](ApiFunction.md) to their HTTP clients.

## Type Parameters

| Type Parameter                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- |
| `TClient` _extends_ `HttpClientBase`\<`unknown`\>                                                                 |
| `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](ApiFunction.md)\<`TClient`, `unknown`[], `unknown`\>\> |
