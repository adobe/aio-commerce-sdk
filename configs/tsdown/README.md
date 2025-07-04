# `@aio-commerce-sdk/config-tsdown`

Shared TSDown build configuration for the Adobe Commerce SDK monorepo.

This internal package provides a consistent build configuration for all packages in the monorepo, ensuring uniform output structure and build behavior across the project.

## Overview

[TSDown](https://tsdown.dev/) is a specialized TypeScript bundler designed for library development. This configuration package provides:

- Dual-format bundling (CommonJS and ESM)
- Automatic type declaration generation
- Tree-shaking optimization
- Consistent output directory structure
- Build hooks for post-processing

## Installation

This is a private package used internally within the monorepo. It's automatically included when you create a new package using the `create-package` generator.

```json
{
  "devDependencies": {
    "@aio-commerce-sdk/config-tsdown": "workspace:*"
  }
}
```

## Usage

In your package's `tsdown.config.ts`:

```typescript
import { baseConfig } from "@aio-commerce-sdk/config-tsdown";
import { defineConfig } from "tsdown";

export default defineConfig({
  ...baseConfig,
  entry: ["source/index.ts"],
});
```

### Multiple Entry Points

For packages with multiple entry points:

```typescript
import { baseConfig } from "@aio-commerce-sdk/config-tsdown";
import { defineConfig } from "tsdown";

export default defineConfig({
  ...baseConfig,
  entry: ["source/index.ts", "source/auth.ts", "source/utils.ts"],
});
```

## Configuration Details

The base configuration provides:

### Output Structure

```
dist/
├── cjs/           # CommonJS bundles
│   ├── index.cjs
│   └── index.d.cts
└── es/            # ESM bundles
    ├── index.js
    └── index.d.ts
```

### Build Features

- **Formats**: Both `cjs` and `esm` outputs
- **Type Declarations**: Automatic `.d.ts` and `.d.cts` generation
- **Tree-shaking**: Enabled by default for optimal bundle sizes
- **Legal Comments**: Preserved inline in the output
- **Source Maps**: Not included by default (for production builds)

## Customization

While the base configuration should work for most packages, you can override any setting:

```typescript
import { baseConfig } from "@aio-commerce-sdk/config-tsdown";
import { defineConfig } from "tsdown";

export default defineConfig({
  ...baseConfig,
  entry: ["source/index.ts"],

  // Override specific options
  outputOptions: {
    ...baseConfig.outputOptions,
    sourcemap: true, // Enable source maps
  },

  // Add additional formats
  format: ["cjs", "esm", "iife"],
});
```

## Best Practices

1. **Always extend the base config** to maintain consistency across the monorepo
2. **List all entry points** explicitly in the `entry` array
3. **Keep the default output structure** unless you have specific requirements
4. **Test your build output** to ensure it matches expectations

## Troubleshooting

### Type declarations in wrong location

The base configuration includes a post-build hook that automatically moves CJS type declarations to the correct directory. If you're experiencing issues, ensure you're not overriding the `hooks` configuration.

### Missing exports

Ensure all your entry points are listed in the `entry` array and that your `package.json` exports field correctly references the built files.

## Related

- [TSDown Documentation](https://tsdown.dev/) - Official TSDown documentation
- [Contributing Guide](../../.github/CONTRIBUTING.md#configuring-the-build) - Build configuration guidelines
