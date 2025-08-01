# `assertImsAuthParams()`

```ts
function assertImsAuthParams(
  config: Record<PropertyKey, unknown>,
): asserts config is {
  clientId: string;
  clientSecrets: string[];
  context?: string;
  environment: EnumValues<{ PROD: "prod"; STAGE: "stage" }>;
  imsOrgId: string;
  scopes: string[];
  technicalAccountEmail: string;
  technicalAccountId: string;
};
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:95](https://github.com/adobe/aio-commerce-sdk/blob/2e9631ab3482e2ba9d40c8de9e8d2373edc2e3ed/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L95)

Asserts the provided configuration for an [ImsAuthProvider](../interfaces/ImsAuthProvider.md).

## Parameters

| Parameter | Type                                 | Description                    |
| --------- | ------------------------------------ | ------------------------------ |
| `config`  | `Record`\<`PropertyKey`, `unknown`\> | The configuration to validate. |

## Returns

`asserts config is { clientId: string; clientSecrets: string[]; context?: string; environment: EnumValues<{ PROD: "prod"; STAGE: "stage" }>; imsOrgId: string; scopes: string[]; technicalAccountEmail: string; technicalAccountId: string }`

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
