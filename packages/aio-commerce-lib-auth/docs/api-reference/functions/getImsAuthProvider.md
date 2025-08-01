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

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/2e9631ab3482e2ba9d40c8de9e8d2373edc2e3ed/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L146)

Creates an [ImsAuthProvider](../interfaces/ImsAuthProvider.md) based on the provided configuration.

## Parameters

| Parameter                          | Type                                                                                                                                                                                                                                                                      | Description                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authParams`                       | \{ `clientId`: `string`; `clientSecrets`: `string`[]; `context?`: `string`; `environment`: `EnumValues`\<\{ `PROD`: `"prod"`; `STAGE`: `"stage"`; \}\>; `imsOrgId`: `string`; `scopes`: `string`[]; `technicalAccountEmail`: `string`; `technicalAccountId`: `string`; \} | An [ImsAuthParams](../type-aliases/ImsAuthParams.md) parameter that contains the configuration for the [ImsAuthProvider](../interfaces/ImsAuthProvider.md). |
| `authParams.clientId`              | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                           |
| `authParams.clientSecrets`         | `string`[]                                                                                                                                                                                                                                                                | -                                                                                                                                                           |
| `authParams.context?`              | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                           |
| `authParams.environment`           | `EnumValues`\<\{ `PROD`: `"prod"`; `STAGE`: `"stage"`; \}\>                                                                                                                                                                                                               | -                                                                                                                                                           |
| `authParams.imsOrgId`              | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                           |
| `authParams.scopes`                | `string`[]                                                                                                                                                                                                                                                                | -                                                                                                                                                           |
| `authParams.technicalAccountEmail` | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                           |
| `authParams.technicalAccountId`    | `string`                                                                                                                                                                                                                                                                  | -                                                                                                                                                           |

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

An [ImsAuthProvider](../interfaces/ImsAuthProvider.md) instance that can be used to get access token and auth headers.

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
