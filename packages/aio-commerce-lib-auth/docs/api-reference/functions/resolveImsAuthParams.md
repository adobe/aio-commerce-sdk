# `resolveImsAuthParams()`

```ts
function resolveImsAuthParams(params: Record<string, unknown>): {
  clientId: string;
  clientSecrets: string[];
  context?: string;
  environment?: "prod" | "stage";
  imsOrgId: string;
  scopes: string[];
  technicalAccountEmail?: string;
  technicalAccountId?: string;
};
```

Defined in: [ims-auth/utils.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-auth/source/lib/ims-auth/utils.ts#L138)

Resolves an [ImsAuthParams](../type-aliases/ImsAuthParams.md) from the given App Builder action inputs.

For OAuth Server-to-Server credentials, use the `include-ims-credentials: true` action
annotation. The legacy fallback to manually-wired `AIO_COMMERCE_AUTH_IMS_*` params is
deprecated and will be removed in a future major release.

## Parameters

| Parameter | Type                            | Description                                                                      |
| --------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `params`  | `Record`\<`string`, `unknown`\> | The App Builder action inputs to resolve the IMS authentication parameters from. |

## Returns

```ts
{
  clientId: string;
  clientSecrets: string[];
  context?: string;
  environment?: "prod" | "stage";
  imsOrgId: string;
  scopes: string[];
  technicalAccountEmail?: string;
  technicalAccountId?: string;
}
```

### clientId

```ts
clientId: string;
```

### clientSecrets

```ts
clientSecrets: string[];
```

### context?

```ts
context?: string;
```

### environment?

```ts
environment?: "prod" | "stage";
```

### imsOrgId

```ts
imsOrgId: string;
```

### scopes

```ts
scopes: string[];
```

### technicalAccountEmail?

```ts
technicalAccountEmail?: string;
```

### technicalAccountId?

```ts
technicalAccountId?: string;
```

## Throws

If the parameters are invalid and cannot be resolved.

## Example

```typescript
// Some App Builder runtime action that needs IMS authentication
export async function main(params) {
  const authProvider = getImsAuthProvider(resolveImsAuthParams(params));

  // Get headers for API requests
  const headers = await authProvider.getHeaders();
  const response = await fetch("https://api.adobe.io/some-endpoint", {
    headers,
  });
  return { statusCode: response.status };
}
```
