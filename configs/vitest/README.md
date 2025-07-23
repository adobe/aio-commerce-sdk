# `@aio-commerce-sdk/config-vitest`

Shared Vitest test configuration for the Adobe Commerce SDK monorepo.

This internal package provides a consistent testing configuration for all packages in the monorepo, ensuring uniform test behavior, coverage requirements, and test execution across the project.

## Overview

[Vitest](https://vitest.dev/) is a blazing fast unit test framework powered by Vite, with out-of-the-box support for TypeScript. This configuration package provides:

- Global test environment setup
- TypeScript path resolution support
- Code coverage thresholds and reporting
- Consistent test execution environment
- Pre-configured test globals

## Installation

This is a private package used internally within the monorepo. It's automatically included when you create a new package using the `create-package` generator.

```json
{
  "devDependencies": {
    "@aio-commerce-sdk/config-vitest": "workspace:*"
  }
}
```

## Usage

In your package's `vitest.config.ts`:

```typescript
import { baseConfig } from "@aio-commerce-sdk/config-vitest/vitest.config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    // Write your Vitest configuration here.
  }),
);
```

### Adding Custom Test Configuration

```typescript
import { baseConfig } from "@aio-commerce-sdk/config-vitest/vitest.config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      // Add setup files
      setupFiles: ["./test/setup.ts"],

      // Configure test timeout
      testTimeout: 10000,
      env: {
        NODE_ENV: "test",
        DEBUG: "false",
      },
    },
  }),
);
```

## Configuration Details

The base configuration provides:

### Test Environment

- **Environment**: `node` (default)
- **Globals**: Enabled, no need to import `describe`, `it`, `expect`, etc. (although you should for explicitness).
- **TypeScript Paths**: Automatically resolved via `vite-tsconfig-paths`

### Coverage Settings

```javascript
coverage: {
  provider: "v8",
  thresholds: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  },
}
```

All packages should maintain at least 70% code coverage across all metrics.

## Customization

While the base configuration should work for most packages, you can override any setting:

```typescript
import { baseConfig } from "@aio-commerce-sdk/config-vitest/vitest.config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      // Increase coverage thresholds
      coverage: {
        thresholds: {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },

      // Add custom reporters
      reporters: ["default", "html"],
    },
  }),
);
```

## Best Practices

1. **Always extend the base config** to maintain consistency across the monorepo
2. **Write tests alongside your source code** in `test/` directories
3. **Maintain coverage thresholds** - don't lower them without good reason
4. **Use test fixtures** for complex test data
5. **Keep tests focused and isolated** - avoid interdependencies

## Common Patterns

### Testing with Mocks

```typescript
import { vi } from "vitest";

// Mock a module
vi.mock("./some-module", () => ({
  someFunction: vi.fn(),
}));
```

### Testing Async Code

```typescript
it("should handle async operations", async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expected);
});
```

### Using Test Fixtures

```typescript
// test/fixtures/user.ts
export const mockUser = {
  id: "123",
  name: "Test User",
  email: "test@example.com",
};

// test/user.test.ts
import { mockUser } from "./fixtures/user";
```

## Troubleshooting

### TypeScript Path Resolution Issues

The base configuration includes `vite-tsconfig-paths` which should automatically resolve TypeScript path mappings. If you encounter issues:

1. Ensure your `tsconfig.json` has proper path mappings
2. Check that the paths are relative to the `baseUrl`
3. Restart the test runner after changing `tsconfig.json`

## Related

- [Vitest Documentation](https://vitest.dev/) - Official Vitest documentation
- [Development Guide](../../.github/DEVELOPMENT.md#testing) - Testing guidelines
- [Coverage Reports](https://vitest.dev/guide/coverage) - Understanding coverage reports
