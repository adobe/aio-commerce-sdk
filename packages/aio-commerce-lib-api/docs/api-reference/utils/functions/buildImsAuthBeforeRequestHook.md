# `buildImsAuthBeforeRequestHook()`

```ts
function buildImsAuthBeforeRequestHook(
  imsAuth:
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
    | ImsAuthProvider,
): (request: KyRequest) => Promise<void>;
```

Defined in: [aio-commerce-lib-api/source/utils/auth/hooks.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-api/source/utils/auth/hooks.ts#L69)

Builds a before request hook for IMS authentication.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                  | Description                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `imsAuth` | \| \{ `clientId`: `string`; `clientSecrets`: `string`[]; `context?`: `string`; `environment?`: `"prod"` \| `"stage"`; `imsOrgId`: `string`; `scopes`: `string`[]; `technicalAccountEmail`: `string`; `technicalAccountId`: `string`; \} \| [`ImsAuthProvider`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-auth/docs/api-reference/type-aliases/ImsAuthProvider.md) | The IMS authentication parameters or IMS auth provider. |

## Returns

(`request`: `KyRequest`) => `Promise`\<`void`\>
