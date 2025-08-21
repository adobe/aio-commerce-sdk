# `getIntegrationAuthProvider()`

```ts
function getIntegrationAuthProvider(authParams: {
  accessToken: string;
  accessTokenSecret: string;
  consumerKey: string;
  consumerSecret: string;
}): IntegrationAuthProvider;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/5f2ef64f385c66b958f7880534fd6c1b1e618fc0/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L108)

Creates an [IntegrationAuthProvider](../type-aliases/IntegrationAuthProvider.md) based on the provided configuration.

## Parameters

| Parameter                      | Type                                                                                                               | Description                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `authParams`                   | \{ `accessToken`: `string`; `accessTokenSecret`: `string`; `consumerKey`: `string`; `consumerSecret`: `string`; \} | The configuration for the integration. |
| `authParams.accessToken`       | `string`                                                                                                           | -                                      |
| `authParams.accessTokenSecret` | `string`                                                                                                           | -                                      |
| `authParams.consumerKey`       | `string`                                                                                                           | -                                      |
| `authParams.consumerSecret`    | `string`                                                                                                           | -                                      |

## Returns

[`IntegrationAuthProvider`](../type-aliases/IntegrationAuthProvider.md)

An [IntegrationAuthProvider](../type-aliases/IntegrationAuthProvider.md) instance that can be used to get auth headers.

## Example

```typescript
const config = {
  consumerKey: "your-consumer-key",
  consumerSecret: "your-consumer-secret",
  accessToken: "your-access-token",
  accessTokenSecret: "your-access-token-secret",
};

const authProvider = getIntegrationAuthProvider(config);

// Get OAuth headers for a REST API call
const headers = authProvider.getHeaders(
  "GET",
  "https://your-store.com/rest/V1/products",
);
console.log(headers); // { Authorization: "OAuth oauth_consumer_key=..., oauth_signature=..." }

// Can also be used with URL objects
const url = new URL("https://your-store.com/rest/V1/customers");
const postHeaders = authProvider.getHeaders("POST", url);
```
