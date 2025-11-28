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
await config.getConfigSchema();
```

**After:**

```typescript
import * as libConfig from "@adobe/aio-commerce-lib-config";

await libConfig.getConfigSchema();
```

**Function signature changes**

All functions now accept an optional `options` object as the last parameter for configuration options (`cacheTimeout`). Some examples:

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
await libConfig.syncCommerceScopes(commerceConfig, { cacheTimeout: 600 });
```

**New `setGlobalLibConfigOptions()` function**

You can now set global defaults for `cacheTimeout` that will be used by all functions:

```typescript
import { setGlobalLibConfigOptions } from "@adobe/aio-commerce-lib-config";

setGlobalLibConfigOptions({
  cacheTimeout: 3600,
});
```

**Migration Guide**

1. Replace `import { init }` with `import * as libConfig` or use named imports
2. Remove all `const config = init()` calls
3. For `getScopeTree()` with `remoteFetch: true`, use the new `refreshData: true` pattern with `commerceConfig`
4. For `syncCommerceScopes()`, pass `commerceConfig` directly as the first parameter
