# `ApiClient`

Defined in: [packages-private/aio-commerce-lib-api/source/lib/api-client.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/10972051f45fae3dd318c777be4a5107aa4882ce/packages-private/aio-commerce-lib-api/source/lib/api-client.ts#L38)

A client that binds a set of [ApiFunction](../type-aliases/ApiFunction.md) to a given HTTP client.

## Constructors

### Constructor

```ts
new ApiClient(): ApiClient;
```

#### Returns

`ApiClient`

## Methods

### create()

```ts
static create<TClient, TFunctions>(client: TClient, functions: TFunctions): ApiClientRecord<TClient, TFunctions>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/api-client.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/10972051f45fae3dd318c777be4a5107aa4882ce/packages-private/aio-commerce-lib-api/source/lib/api-client.ts#L39)

#### Type Parameters

| Type Parameter                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- |
| `TClient` _extends_ `HttpClientBase`\<`unknown`\>                                                                         |
| `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](../type-aliases/ApiFunction.md)\<`TClient`, `any`[], `any`\>\> |

#### Parameters

| Parameter   | Type         |
| ----------- | ------------ |
| `client`    | `TClient`    |
| `functions` | `TFunctions` |

#### Returns

[`ApiClientRecord`](../type-aliases/ApiClientRecord.md)\<`TClient`, `TFunctions`\>
