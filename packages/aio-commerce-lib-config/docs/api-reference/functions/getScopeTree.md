# `getScopeTree()`

## Call Signature

```ts
function getScopeTree(
  params?: GetCachedScopeTreeParams,
  options?: LibConfigOptions,
): Promise<GetScopeTreeResult>;
```

Defined in: [packages/aio-commerce-lib-config/source/config-manager.ts:123](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/config-manager.ts#L123)

Gets the scope tree from cache or Commerce API.

The scope tree represents the hierarchical structure of configuration scopes available
in your Adobe Commerce instance. This includes both system scopes (global, website, store)
and custom scopes that may have been defined.

### Parameters

| Parameter  | Type                                                                      | Description                                                                    |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `params?`  | [`GetCachedScopeTreeParams`](../type-aliases/GetCachedScopeTreeParams.md) | Configuration options. If `refreshData` is true, `commerceConfig` is required. |
| `options?` | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md)                 | Optional library configuration options for cache timeout.                      |

### Returns

`Promise`\<[`GetScopeTreeResult`](../type-aliases/GetScopeTreeResult.md)\>

Promise resolving to scope tree with metadata about data freshness and any fallback information.

### Examples

```typescript
import { getScopeTree } from "@adobe/aio-commerce-lib-config";

// Get cached scope tree (default behavior)
const result = await getScopeTree();
console.log(result.scopeTree); // Array of scope nodes
console.log(result.isCachedData); // true
```

```typescript
import { getScopeTree } from "@adobe/aio-commerce-lib-config";
import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";

// Refresh scope tree from Commerce API
const commerceConfig: CommerceHttpClientParams = {
  url: "https://your-commerce-instance.com",
  // ... other auth config
};

const result = await getScopeTree(
  { refreshData: true, commerceConfig },
  { cacheTimeout: 600000 },
);
console.log(result.scopeTree); // Fresh data from Commerce API
console.log(result.isCachedData); // false
if (result.fallbackError) {
  console.warn("Used fallback data:", result.fallbackError);
}
```

```typescript
import { getScopeTree } from "@adobe/aio-commerce-lib-config";

// Get scope tree with custom cache timeout
const result = await getScopeTree(undefined, { cacheTimeout: 600000 });
```

## Call Signature

```ts
function getScopeTree(
  params: GetFreshScopeTreeParams,
  options?: LibConfigOptions,
): Promise<GetScopeTreeResult>;
```

Defined in: [packages/aio-commerce-lib-config/source/config-manager.ts:129](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/config-manager.ts#L129)

Gets the scope tree from cache or Commerce API.

The scope tree represents the hierarchical structure of configuration scopes available
in your Adobe Commerce instance. This includes both system scopes (global, website, store)
and custom scopes that may have been defined.

### Parameters

| Parameter  | Type                                                                    | Description                                                                    |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `params`   | [`GetFreshScopeTreeParams`](../type-aliases/GetFreshScopeTreeParams.md) | Configuration options. If `refreshData` is true, `commerceConfig` is required. |
| `options?` | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md)               | Optional library configuration options for cache timeout.                      |

### Returns

`Promise`\<[`GetScopeTreeResult`](../type-aliases/GetScopeTreeResult.md)\>

Promise resolving to scope tree with metadata about data freshness and any fallback information.

### Examples

```typescript
import { getScopeTree } from "@adobe/aio-commerce-lib-config";

// Get cached scope tree (default behavior)
const result = await getScopeTree();
console.log(result.scopeTree); // Array of scope nodes
console.log(result.isCachedData); // true
```

```typescript
import { getScopeTree } from "@adobe/aio-commerce-lib-config";
import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";

// Refresh scope tree from Commerce API
const commerceConfig: CommerceHttpClientParams = {
  url: "https://your-commerce-instance.com",
  // ... other auth config
};

const result = await getScopeTree(
  { refreshData: true, commerceConfig },
  { cacheTimeout: 600000 },
);
console.log(result.scopeTree); // Fresh data from Commerce API
console.log(result.isCachedData); // false
if (result.fallbackError) {
  console.warn("Used fallback data:", result.fallbackError);
}
```

```typescript
import { getScopeTree } from "@adobe/aio-commerce-lib-config";

// Get scope tree with custom cache timeout
const result = await getScopeTree(undefined, { cacheTimeout: 600000 });
```
