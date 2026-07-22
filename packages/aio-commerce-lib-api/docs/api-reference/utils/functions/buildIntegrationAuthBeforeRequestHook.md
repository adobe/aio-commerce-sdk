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

Defined in: [aio-commerce-lib-api/source/utils/auth/hooks.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-api/source/utils/auth/hooks.ts#L48)

Builds a before request hook for integration authentication.

## Parameters

| Parameter         | Type                                                                                                                                                                                                                                                                                                | Description                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `integrationAuth` | \| \{ `accessToken`: `string`; `accessTokenSecret`: `string`; `consumerKey`: `string`; `consumerSecret`: `string`; \} \| [`IntegrationAuthProvider`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-auth/docs/api-reference/type-aliases/IntegrationAuthProvider.md) | The integration authentication parameters or integration auth provider. |

## Returns

(`request`: `KyRequest`) => `void`
