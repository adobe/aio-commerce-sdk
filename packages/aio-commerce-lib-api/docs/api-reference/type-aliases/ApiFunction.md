# `ApiFunction()\<TClient, TArgs, TResult\>`

```ts
type ApiFunction<TClient, TArgs, TResult> = (
  clients: TClient,
  ...args: TArgs
) => TResult;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/api-client.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-api/source/lib/api-client.ts#L16)

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
