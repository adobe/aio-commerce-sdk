# `ApiFunction()\<TClient, TArgs, TResult\>`

```ts
type ApiFunction<TClient, TArgs, TResult> = (
  clients: TClient,
  ...args: TArgs
) => TResult;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/api-client.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/10972051f45fae3dd318c777be4a5107aa4882ce/packages-private/aio-commerce-lib-api/source/lib/api-client.ts#L16)

A function that takes an object of HTTP clients and returns something.

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
