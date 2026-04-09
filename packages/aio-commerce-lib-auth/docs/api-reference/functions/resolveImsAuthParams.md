# `resolveImsAuthParams()`

```ts
function resolveImsAuthParams(params: Record<string, unknown>): {
  clientId: string;
  clientSecrets: string[];
  context?: string;
  environment?: "prod" | "stage";
  imsOrgId: string;
  scopes: string[];
  technicalAccountEmail: string;
  technicalAccountId: string;
};
```

Defined in: [ims-auth/utils.ts:131](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-auth/source/lib/ims-auth/utils.ts#L131)

Resolves an [ImsAuthParams](../type-aliases/ImsAuthParams.md) from the given App Builder action inputs.

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
  technicalAccountEmail: string;
  technicalAccountId: string;
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
optional context: string;
```

### environment?

```ts
optional environment: "prod" | "stage";
```

### imsOrgId

```ts
imsOrgId: string;
```

### scopes

```ts
scopes: string[];
```

### technicalAccountEmail

```ts
technicalAccountEmail: string;
```

### technicalAccountId

```ts
technicalAccountId: string;
```

## Throws

If the parameters are invalid and cannot be resolved.

## Example

```typescript
// Some App Builder runtime action that needs IMS authentication
export function main(params) {
  const imsAuthProvider = getImsAuthProvider(resolveImsAuthParams(params));

  // Get headers for API requests
  const headers = await authProvider.getHeaders();
  const response = await fetch("https://api.adobe.io/some-endpoint", {
    headers: await authProvider.getHeaders(),
  });
}
```
