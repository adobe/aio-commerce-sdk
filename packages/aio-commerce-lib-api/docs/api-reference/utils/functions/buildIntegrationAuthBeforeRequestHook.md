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

Defined in: [aio-commerce-lib-api/source/utils/auth/hooks.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-api/source/utils/auth/hooks.ts#L48)

Builds a before request hook for integration authentication.

## Parameters

| Parameter         | Type                                                                                                                                                                                                                                                                                                | Description                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `integrationAuth` | \| \{ `accessToken`: `string`; `accessTokenSecret`: `string`; `consumerKey`: `string`; `consumerSecret`: `string`; \} \| [`IntegrationAuthProvider`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-auth/docs/api-reference/type-aliases/IntegrationAuthProvider.md) | The integration authentication parameters or integration auth provider. |

## Returns

(`request`: `KyRequest`) => `void`
