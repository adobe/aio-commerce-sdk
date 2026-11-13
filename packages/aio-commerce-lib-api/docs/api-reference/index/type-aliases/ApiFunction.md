# `ApiFunction\<TClient *extends* `HttpClientBase`\<`unknown`\>, TArgs *extends* `unknown`[], TResult\>`

```ts
type ApiFunction<
  TClient extends HttpClientBase<unknown>,
  TArgs extends unknown[],
  TResult,
> = (clients: TClient, ...args: TArgs) => TResult;
```

Defined in: [aio-commerce-lib-api/source/lib/api-client.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-api/source/lib/api-client.ts#L16)

A generic function that takes an HTTP client and some other arguments and returns a result.

## Type Parameters

| Type Parameter                                                                        |
| ------------------------------------------------------------------------------------- |
| <a id="type-parameter-tclient"></a> `TClient` _extends_ `HttpClientBase`\<`unknown`\> |
| <a id="type-parameter-targs"></a> `TArgs` _extends_ `unknown`[]                       |
| <a id="type-parameter-tresult"></a> `TResult`                                         |

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `clients` | `TClient` |
| ...`args` | `TArgs`   |

## Returns

`TResult`
