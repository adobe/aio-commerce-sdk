---
"@adobe/aio-commerce-lib-config": minor
---

[BREAKING] Refactor API to use selector pattern and improve type safety

**Breaking Changes**

**Scope Selection API Refactoring**

The configuration functions (`getConfiguration`, `getConfigurationByKey`, `setConfiguration`) now use a selector-based API instead of positional arguments with `...args`. This provides better type safety and clearer API usage.

**Before:**

```typescript
import * as libConfig from "@adobe/aio-commerce-lib-config";

// Ambiguous - which argument is which?
await libConfig.getConfiguration("scope-id");
await libConfig.getConfiguration("website", "website");
await libConfig.getConfiguration("website");
```

**After:**

```typescript
import {
  getConfiguration,
  byScopeId,
  byCodeAndLevel,
  byCode,
} from "@adobe/aio-commerce-lib-config";

// Clear and type-safe
await getConfiguration(byScopeId("scope-id"));
await getConfiguration(byCodeAndLevel("website", "website"));
await getConfiguration(byCode("website"));
```

**New Selector Helper Functions**

Three new helper functions are exported to create selector objects:

- `byScopeId(scopeId: string)` - Select a scope by its unique ID
- `byCodeAndLevel(code: string, level: string)` - Select a scope by code and level
- `byCode(code: string)` - Select a scope by code (uses default level)

**Migration Guide**

1. Replace positional arguments with selector helper functions:
   - `getConfiguration("scope-id")` → `getConfiguration(byScopeId("scope-id"))`
   - `getConfiguration("website", "website")` → `getConfiguration(byCodeAndLevel("website", "website"))`
   - `getConfiguration("website")` → `getConfiguration(byCode("website"))`

**Documentation Improvements**

- Added comprehensive JSDoc comments with examples for all public API functions
- Added JSDoc comments for internal module functions with `@param` and `@throws` documentation
- Improved type documentation with descriptions
