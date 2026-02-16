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

Defined in: [integration-auth/utils.ts:71](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-auth/source/lib/integration-auth/utils.ts#L71)

Asserts the provided configuration for an Adobe Commerce [IntegrationAuthProvider](../type-aliases/IntegrationAuthProvider.md).

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
