# `isIntegrationAuthProvider()`

```ts
function isIntegrationAuthProvider(
  provider: unknown,
): provider is IntegrationAuthProvider;
```

Defined in: [integration-auth/provider.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts#L58)

Type guard to check if a value is an IntegrationAuthProvider instance.

## Parameters

| Parameter  | Type      | Description         |
| ---------- | --------- | ------------------- |
| `provider` | `unknown` | The value to check. |

## Returns

`provider is IntegrationAuthProvider`

`true` if the value is an IntegrationAuthProvider, `false` otherwise.

## Example

```typescript
import { getIntegrationAuthProvider, isIntegrationAuthProvider } from "@adobe/aio-commerce-lib-auth";

// Imagine you have an object that it's not strictly typed as IntegrationAuthProvider.
const provider = getIntegrationAuthProvider({ ... }) as unknown;

if (isIntegrationAuthProvider(provider)) {
  // TypeScript knows provider is IntegrationAuthProvider
  const headers = provider.getHeaders("GET", "https://api.example.com");
}
```
