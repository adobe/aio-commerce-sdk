# `syncCommerceScopes()`

```ts
function syncCommerceScopes(
  commerceConfig: CommerceHttpClientParams,
  options?: LibConfigOptions,
): Promise<{
  error?: string;
  scopeTree: ScopeTree;
  synced: boolean;
}>;
```

Defined in: [aio-commerce-lib-config/source/config-manager.ts:213](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/config-manager.ts#L213)

Syncs Commerce scopes by forcing a fresh fetch from Commerce API and updating the cache.

This function is useful when you need to ensure your scope tree is up-to-date with
the latest changes from your Commerce instance. It will fetch fresh data and update
both the cache and persistent storage.

## Parameters

| Parameter        | Type                                                                                                                                                                        | Description                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `commerceConfig` | [`CommerceHttpClientParams`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/type-aliases/CommerceHttpClientParams.md) | The Commerce HTTP client configuration required for API calls. |
| `options?`       | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md)                                                                                                                   | Optional library configuration options for cache timeout.      |

## Returns

`Promise`\<\{
`error?`: `string`;
`scopeTree`: [`ScopeTree`](../type-aliases/ScopeTree.md);
`synced`: `boolean`;
\}\>

Promise resolving to sync result with updated scope tree and sync status.

## Example

```typescript
import { syncCommerceScopes } from "@adobe/aio-commerce-lib-config";
import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";

const commerceConfig: CommerceHttpClientParams = {
  url: "https://your-commerce-instance.com",
  // ... other auth config
};

const result = await syncCommerceScopes(commerceConfig);

if (result.synced) {
  console.log("Successfully synced scope tree");
  console.log(result.scopeTree); // Updated scope tree
} else {
  console.log("Used cached data");
}

if (result.error) {
  console.warn("Sync completed with errors:", result.error);
}
```
