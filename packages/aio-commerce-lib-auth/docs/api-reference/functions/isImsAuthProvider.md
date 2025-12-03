# `isImsAuthProvider()`

```ts
function isImsAuthProvider(provider: unknown): provider is ImsAuthProvider;
```

Defined in: [packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts#L77)

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
