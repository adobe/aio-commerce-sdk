# `ApiClient`

Defined in: [packages/aio-commerce-lib-api/source/lib/api-client.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-api/source/lib/api-client.ts#L38)

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

Defined in: [packages/aio-commerce-lib-api/source/lib/api-client.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-api/source/lib/api-client.ts#L44)

Creates a new API client that binds a set of [ApiFunction](../type-aliases/ApiFunction.md) to a given HTTP client.

#### Type Parameters

| Type Parameter                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------- |
| `TClient` _extends_ `HttpClientBase`\<`unknown`\>                                                                         |
| `TFunctions` _extends_ `Record`\<`string`, [`ApiFunction`](../type-aliases/ApiFunction.md)\<`TClient`, `any`[], `any`\>\> |

#### Parameters

| Parameter   | Type         | Description                                   |
| ----------- | ------------ | --------------------------------------------- |
| `client`    | `TClient`    | The HTTP client to bind the API functions to. |
| `functions` | `TFunctions` | The API functions to bind to the HTTP client. |

#### Returns

[`ApiClientRecord`](../type-aliases/ApiClientRecord.md)\<`TClient`, `TFunctions`\>
