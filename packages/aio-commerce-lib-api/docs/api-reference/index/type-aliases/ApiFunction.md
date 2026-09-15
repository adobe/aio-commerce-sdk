# `ApiFunction\<TClient *extends* `HttpClientBase`\<`unknown`\>, TArgs *extends* `unknown`[], TResult\>`

```ts
type ApiFunction<
  TClient extends HttpClientBase<unknown>,
  TArgs extends unknown[],
  TResult,
> = (clients: TClient, ...args: TArgs) => TResult;
```

Defined in: [aio-commerce-lib-api/source/lib/api-client.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-api/source/lib/api-client.ts#L16)

A generic function that takes an HTTP client and some other arguments and returns a result.

## Type Parameters

| Type Parameter                                    |
| ------------------------------------------------- |
| `TClient` _extends_ `HttpClientBase`\<`unknown`\> |
| `TArgs` _extends_ `unknown`[]                     |
| `TResult`                                         |

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `clients` | `TClient` |
| ...`args` | `TArgs`   |

## Returns

`TResult`
