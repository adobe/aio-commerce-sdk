# `assertIntegrationAuthParams()`

```ts
function assertIntegrationAuthParams(
  config: Record<PropertyKey, unknown>,
): asserts config is {
  accessToken: string;
  accessTokenSecret: string;
  consumerKey: string;
  consumerSecret: string;
};
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:70](https://github.com/adobe/aio-commerce-sdk/blob/7b593b329256b2a01f618a3bfec89516edd0e844/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L70)

Asserts the provided configuration for an Adobe Commerce [IntegrationAuthProvider](../interfaces/IntegrationAuthProvider.md).

## Parameters

| Parameter | Type                                 | Description                    |
| --------- | ------------------------------------ | ------------------------------ |
| `config`  | `Record`\<`PropertyKey`, `unknown`\> | The configuration to validate. |

## Returns

`asserts config is { accessToken: string; accessTokenSecret: string; consumerKey: string; consumerSecret: string }`

## Throws

If the configuration is invalid.

## Examples

```typescript
const config = {
  consumerKey: "your-consumer-key",
  consumerSecret: "your-consumer-secret",
  accessToken: "your-access-token",
  accessTokenSecret: "your-access-token-secret",
};

// This will validate the config and throw if invalid
assertIntegrationAuthParams(config);
```

```typescript
// Example of a failing assert:
try {
  assertIntegrationAuthParams({
    consumerKey: "valid-consumer-key",
    // Missing required fields like consumerSecret, accessToken, accessTokenSecret
  });
} catch (error) {
  console.error(error.message); // "Invalid IntegrationAuthProvider configuration"
  console.error(error.issues); // Array of validation issues
}
```
