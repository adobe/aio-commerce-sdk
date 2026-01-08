# `buildIntegrationAuthBeforeRequestHook()`

```ts
function buildIntegrationAuthBeforeRequestHook(
  integrationAuth:
    | {
        accessToken: string;
        accessTokenSecret: string;
        consumerKey: string;
        consumerSecret: string;
      }
    | IntegrationAuthProvider,
): (request: KyRequest) => void;
```

Defined in: [packages/aio-commerce-lib-api/source/utils/auth/hooks.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-api/source/utils/auth/hooks.ts#L48)

Builds a before request hook for integration authentication.

## Parameters

| Parameter         | Type                                                                                                                                                                                                                                                                                                | Description                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `integrationAuth` | \| \{ `accessToken`: `string`; `accessTokenSecret`: `string`; `consumerKey`: `string`; `consumerSecret`: `string`; \} \| [`IntegrationAuthProvider`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-auth/docs/api-reference/type-aliases/IntegrationAuthProvider.md) | The integration authentication parameters or integration auth provider. |

## Returns

```ts
(request: KyRequest): void;
```

### Parameters

| Parameter | Type        |
| --------- | ----------- |
| `request` | `KyRequest` |

### Returns

`void`
