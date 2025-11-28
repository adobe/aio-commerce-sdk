---
"@adobe/aio-commerce-lib-config": minor
---

[BREAKING] Refactor library to use tree-shakeable function-based API instead of class-based initialization pattern

**Breaking Changes**

**Removed `init()` function**

The library no longer uses an initialization function. Instead, all functions are exported directly from the module.

**Before:**

```typescript
import { init } from "@adobe/aio-commerce-lib-config";

const config = init();
await config.getConfiguration("scope-id");
```

**After:**

```typescript
import * as libConfig from "@adobe/aio-commerce-lib-config";

await libConfig.getConfiguration("scope-id");
```

**Function signature changes**

All functions now accept an optional `params` object as the first (or second) parameter for configuration options (`namespace`, `cacheTimeout`). The function arguments remain the same but are shifted.

**`getScopeTree()`**

**Before:**

```typescript
await config.getScopeTree(remoteFetch?: boolean);
```

**After:**

```typescript
// For cached data (default)
await libConfig.getScopeTree();

// For fresh data from Commerce API
await libConfig.getScopeTree({
  refreshData: true,
  commerceConfig: {
    /* Commerce client config */
  },
});
```

**`syncCommerceScopes()`**

**Before:**

```typescript
const config = init({ commerce: commerceConfig });
await config.syncCommerceScopes();
```

**After:**

```typescript
await libConfig.syncCommerceScopes({ commerceConfig });
```

**`getConfiguration()`**

**Before:**

```typescript
await config.getConfiguration(...args);
```

**After:**

```typescript
// Without params (uses defaults)
await libConfig.getConfiguration(...args);

// With params
await libConfig.getConfiguration({ namespace: "custom" }, ...args);
```

**`getConfigurationByKey()`**

**Before:**

```typescript
await config.getConfigurationByKey(configKey, ...args);
```

**After:**

```typescript
// Without params (uses defaults)
await libConfig.getConfigurationByKey(configKey, ...args);

// With params
await libConfig.getConfigurationByKey(
  configKey,
  { namespace: "custom" },
  ...args,
);
```

**`setConfiguration()`**

**Before:**

```typescript
await config.setConfiguration(request, ...args);
```

**After:**

```typescript
// Without params (uses defaults)
await libConfig.setConfiguration(request, ...args);

// With params
await libConfig.setConfiguration(request, { namespace: "custom" }, ...args);
```

**`setCustomScopeTree()`**

**Before:**

```typescript
await config.setCustomScopeTree(request);
```

**After:**

```typescript
// Without params (uses defaults)
await libConfig.setCustomScopeTree(request);

// With params
await libConfig.setCustomScopeTree(request, { namespace: "custom" });
```

**`getConfigSchema()`**

**Before:**

```typescript
await config.getConfigSchema();
```

**After:**

```typescript
// Without params (uses defaults)
await libConfig.getConfigSchema();

// With params
await libConfig.getConfigSchema({ namespace: "custom" });
```

**New `setGlobalFetchOptions()` function**

You can now set global defaults for `namespace` and `cacheTimeout` that will be used by all functions:

```typescript
import * as libConfig from "@adobe/aio-commerce-lib-config";

libConfig.setGlobalFetchOptions({
  namespace: "my-namespace",
  cacheTimeout: 3600,
});
```

**Migration Guide**

1. Replace `import { init }` with `import * as libConfig`
2. Remove all `const config = init()` calls
3. Update all method calls from `config.method()` to `libConfig.method()`
4. For `getScopeTree()` with `remoteFetch: true`, use the new `refreshData: true` pattern with `commerceConfig`
5. For `syncCommerceScopes()`, pass `commerceConfig` directly in the params object
6. Optionally use `setGlobalFetchOptions()` to set defaults instead of passing params to each function
