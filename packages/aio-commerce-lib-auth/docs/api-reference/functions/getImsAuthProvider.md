# `getImsAuthProvider()`

```ts
function getImsAuthProvider(authParams: {
  clientId: string;
  clientSecrets: string[];
  context?: string;
  environment: EnumValues<{
     PROD: "prod";
     STAGE: "stage";
  }>;
  imsOrgId: string;
  scopes: string[];
  technicalAccountEmail: string;
  technicalAccountId: string;
}): {
  getAccessToken: () => Promise<string>;
  getHeaders: () => Promise<{
     Authorization: string;
     x-api-key: string;
  }>;
};
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:147](https://github.com/adobe/aio-commerce-sdk/blob/5f2ef64f385c66b958f7880534fd6c1b1e618fc0/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L147)

Creates an [ImsAuthProvider](../type-aliases/ImsAuthProvider.md) based on the provided configuration.

## Parameters

| Parameter                          | Type                                                                                                                                                                                                                                                                      | Description                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authParams`                       | \{ `clientId`: `string`; `clientSecrets`: `string`[]; `context?`: `string`; `environment`: `EnumValues`\<\{ `PROD`: `"prod"`; `STAGE`: `"stage"`; \}\>; `imsOrgId`: `string`; `scopes`: `string`[]; `technicalAccountEmail`: `string`; `technicalAccountId`: `string`; \} | An [ImsAuthParams](../type-aliases/ImsAuthParams.md) parameter that contains the configuration for the [ImsAuthProvider](../type-aliases/ImsAuthProvider.md). |
| `authParams.clientId`              | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                             |
| `authParams.clientSecrets`         | `string`[]                                                                                                                                                                                                                                                                | -                                                                                                                                                             |
| `authParams.context?`              | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                             |
| `authParams.environment`           | `EnumValues`\<\{ `PROD`: `"prod"`; `STAGE`: `"stage"`; \}\>                                                                                                                                                                                                               | -                                                                                                                                                             |
| `authParams.imsOrgId`              | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                             |
| `authParams.scopes`                | `string`[]                                                                                                                                                                                                                                                                | -                                                                                                                                                             |
| `authParams.technicalAccountEmail` | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                             |
| `authParams.technicalAccountId`    | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                             |

## Returns

```ts
{
  getAccessToken: () => Promise<string>;
  getHeaders: () => Promise<{
     Authorization: string;
     x-api-key: string;
  }>;
}
```

An [ImsAuthProvider](../type-aliases/ImsAuthProvider.md) instance that can be used to get access token and auth headers.

### getAccessToken()

```ts
getAccessToken: () => Promise<string>;
```

#### Returns

`Promise`\<`string`\>

### getHeaders()

```ts
getHeaders: () => Promise<{
  Authorization: string;
  x-api-key: string;
}>;
```

#### Returns

`Promise`\<\{
`Authorization`: `string`;
`x-api-key`: `string`;
\}\>

## Example

```typescript
const config = {
  clientId: "your-client-id",
  clientSecrets: ["your-client-secret"],
  technicalAccountId: "your-technical-account-id",
  technicalAccountEmail: "your-account@example.com",
  imsOrgId: "your-ims-org-id@AdobeOrg",
  scopes: ["AdobeID", "openid"],
  environment: "prod",
  context: "my-app-context",
};

const authProvider = getImsAuthProvider(config);

// Get access token
const token = await authProvider.getAccessToken();
console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."

// Get headers for API requests
const headers = await authProvider.getHeaders();
console.log(headers);
// {
//   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
//   "x-api-key": "your-client-id"
// }

// Use headers in API calls
const response = await fetch("https://api.adobe.io/some-endpoint", {
  headers: await authProvider.getHeaders(),
});
```
