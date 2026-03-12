# `isAuthProvider()`

```ts
function isAuthProvider(
  auth:
    | {
        clientId: string;
        clientSecrets: string[];
        context?: string;
        environment?: "prod" | "stage";
        imsOrgId: string;
        scopes: string[];
        technicalAccountEmail: string;
        technicalAccountId: string;
      }
    | ImsAuthProvider
    | {
        accessToken: string;
        accessTokenSecret: string;
        consumerKey: string;
        consumerSecret: string;
      }
    | IntegrationAuthProvider
    | {
        clientId: string;
        clientSecrets: string[];
        context?: string;
        environment?: "prod" | "stage";
        imsOrgId: string;
        scopes?: string[];
        technicalAccountEmail: string;
        technicalAccountId: string;
      },
): auth is ImsAuthProvider | IntegrationAuthProvider;
```

Defined in: [aio-commerce-lib-api/source/utils/auth/hooks.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-api/source/utils/auth/hooks.ts#L33)

Type guard to check if the given auth object is an auth provider.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Description               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `auth`    | \| \{ `clientId`: `string`; `clientSecrets`: `string`[]; `context?`: `string`; `environment?`: `"prod"` \| `"stage"`; `imsOrgId`: `string`; `scopes`: `string`[]; `technicalAccountEmail`: `string`; `technicalAccountId`: `string`; \} \| [`ImsAuthProvider`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-auth/docs/api-reference/type-aliases/ImsAuthProvider.md) \| \{ `accessToken`: `string`; `accessTokenSecret`: `string`; `consumerKey`: `string`; `consumerSecret`: `string`; \} \| [`IntegrationAuthProvider`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-auth/docs/api-reference/type-aliases/IntegrationAuthProvider.md) \| \{ `clientId`: `string`; `clientSecrets`: `string`[]; `context?`: `string`; `environment?`: `"prod"` \| `"stage"`; `imsOrgId`: `string`; `scopes?`: `string`[]; `technicalAccountEmail`: `string`; `technicalAccountId`: `string`; \} | The auth object to check. |

## Returns

auth is ImsAuthProvider \| IntegrationAuthProvider
