# `assertImsAuthParams()`

```ts
function assertImsAuthParams(
  config: Record<PropertyKey, unknown>,
): asserts config is {
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

Defined in: [ims-auth/utils.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-auth/source/lib/ims-auth/utils.ts#L104)

Asserts the provided configuration for an [ImsAuthProvider](../type-aliases/ImsAuthProvider.md).

## Parameters

| Parameter | Type                                 | Description                    |
| --------- | ------------------------------------ | ------------------------------ |
| `config`  | `Record`\<`PropertyKey`, `unknown`\> | The configuration to validate. |

## Returns

asserts config is \{ clientId: string; clientSecrets: string\[\]; context?: string; environment?: "prod" \| "stage"; imsOrgId: string; scopes: string\[\]; technicalAccountEmail: string; technicalAccountId: string \}

## Throws

If the configuration is invalid.

## Examples

```typescript
const config = {
  clientId: "your-client-id",
  clientSecrets: ["your-client-secret"],
  technicalAccountId: "your-technical-account-id",
  technicalAccountEmail: "your-account@example.com",
  imsOrgId: "your-ims-org-id@AdobeOrg",
  scopes: ["AdobeID", "openid"],
  environment: "prod", // or "stage"
  context: "my-app-context",
};

// This will validate the config and throw if invalid
assertImsAuthParams(config);
```

```typescript
// Example of a failing assert:
try {
  assertImsAuthParams({
    clientId: "valid-client-id",
    // Missing required fields like clientSecrets, technicalAccountId, etc.
  });
} catch (error) {
  console.error(error.message); // "Invalid ImsAuthProvider configuration"
  console.error(error.issues); // Array of validation issues
}
```
