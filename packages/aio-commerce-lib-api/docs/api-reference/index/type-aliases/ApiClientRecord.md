# `ApiClientRecord\<TClient *extends* `HttpClientBase`\<`unknown`\>, TFunctions *extends* `Record`\<`string`, [`ApiFunction`](ApiFunction.md)\<`TClient`, `unknown`[], `unknown`\>\>\>`

```ts
type ApiClientRecord<
  TClient extends HttpClientBase<unknown>,
  TFunctions extends Record<string, ApiFunction<TClient, unknown[], unknown>>,
> = {
  [K in keyof TFunctions]: TFunctions[K] extends ApiFunction<
    TClient,
    infer Args,
    infer Result
  >
    ? (args: Args) => Result
    : never;
};
```

Defined in: [aio-commerce-lib-api/source/lib/api-client.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-api/source/lib/api-client.ts#L23)

A client that bounds a set of [ApiFunction](ApiFunction.md) to their HTTP clients.

## Type Parameters

| Type Parameter                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="type-parameter-tclient"></a> `TClient` _extends_ `HttpClientBase`\<`unknown`\>                                                                    |
| <a id="type-parameter-tfunctions"></a> `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](ApiFunction.md)\<`TClient`, `unknown`[], `unknown`\>\> |
