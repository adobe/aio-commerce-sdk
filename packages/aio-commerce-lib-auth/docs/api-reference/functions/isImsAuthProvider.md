# `isImsAuthProvider()`

```ts
function isImsAuthProvider(provider: unknown): provider is ImsAuthProvider;
```

Defined in: [ims-auth/provider.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L69)

Type guard to check if a value is an ImsAuthProvider instance.

## Parameters

| Parameter  | Type      | Description         |
| ---------- | --------- | ------------------- |
| `provider` | `unknown` | The value to check. |

## Returns

`provider is ImsAuthProvider`

`true` if the value is an ImsAuthProvider, `false` otherwise.

## Example

```typescript
import { getImsAuthProvider, isImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

// Imagine you have an object that it's not strictly typed as ImsAuthProvider.
const provider = getImsAuthProvider({ ... }) as unknown;

if (isImsAuthProvider(provider)) {
  // TypeScript knows provider is ImsAuthProvider
  const token = await provider.getAccessToken();
}
```
