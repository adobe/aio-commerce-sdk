# `@aio-commerce-sdk/config-typedoc`

Shared TypeDoc documentation configuration for the Adobe Commerce SDK monorepo.

This internal package provides a consistent documentation generation configuration for all packages in the monorepo, ensuring uniform API documentation output with markdown format across the project.

## Overview

[TypeDoc](https://typedoc.org/) is a documentation generator for TypeScript projects. This configuration package provides:

- Markdown output format via `typedoc-plugin-markdown`
- Consistent documentation structure
- Default settings for comprehensive API reference generation

## Installation

This is a private package used internally within the monorepo. It's automatically included when you create a new package using the `create-package` generator.

```json
{
  "devDependencies": {
    "@aio-commerce-sdk/config-typedoc": "workspace:*"
  }
}
```

## Usage

In your package's `typedoc.json`:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "extends": ["@aio-commerce-sdk/config-typedoc/typedoc.json"],
  "entryPoints": ["./source/index.ts"],
  "out": "./docs/api-reference"
}
```

### Generating Documentation

Add a script to your `package.json`:

```json
{
  "scripts": {
    "docs": "typedoc"
  }
}
```

Then run:

```bash
pnpm run docs
```

## Customization

While the base configuration should work for most packages, you can override any setting:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "extends": ["@aio-commerce-sdk/config-typedoc/typedoc.json"],
  "entryPoints": ["./source/index.ts"],
  "out": "./docs/api-reference",

  // Custom overrides
  "includeVersion": false,
  "hideGenerator": true
}
```

### Multiple Entry Points

For packages with multiple exports:

```json
{
  "extends": ["@aio-commerce-sdk/config-typedoc/typedoc.json"],
  "entryPoints": ["./source/index.ts", "./source/auth.ts", "./source/utils.ts"],
  "out": "./docs/api-reference"
}
```

## Best Practices

1. **Always extend the base config** to maintain consistency across the monorepo
2. **Document all public APIs** with comprehensive JSDoc comments
3. **Use meaningful examples** in your documentation
4. **Keep documentation up-to-date** with code changes

## Writing Good Documentation

### Function Documentation

````typescript
/**
 * Calculates the total price including tax.
 *
 * @description
 * This function takes a base price and tax rate to calculate
 * the final price. It rounds to 2 decimal places.
 *
 * @param basePrice - The price before tax
 * @param taxRate - The tax rate as a decimal (e.g., 0.08 for 8%)
 * @returns The total price including tax
 *
 * @example
 * ```typescript
 * const total = calculateTotal(100, 0.08);
 * console.log(total); // 108.00
 * ```
 *
 * @since 1.0.0
 */
export function calculateTotal(basePrice: number, taxRate: number): number {
  return Math.round(basePrice * (1 + taxRate) * 100) / 100;
}
````

### Interface Documentation

```typescript
/** Configuration options for the SDK client. */
export interface ClientConfig {
  /**
   * The API endpoint URL.
   * @default "https://api.example.com"
   */
  endpoint?: string;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Whether to retry failed requests.
   * @default true
   */
  retryEnabled?: boolean;
}
```

## Troubleshooting

### Missing Documentation

If your exports aren't appearing in the documentation:

1. Ensure they're exported from the entry point(s)
2. Check that they have proper JSDoc comments
3. Verify they're not excluded by `excludeExternals`

### Formatting Issues

If the markdown output looks incorrect:

1. Check your JSDoc syntax is valid
2. Ensure you're using supported tags
3. Verify code examples are properly formatted

### Build Errors

If TypeDoc fails to generate:

1. Ensure your TypeScript compiles without errors
2. Check that all entry points exist
3. Verify your `tsconfig.json` is properly configured

## Related

- [TypeDoc Documentation](https://typedoc.org/) - Official TypeDoc documentation
- [TypeDoc Plugin Markdown](https://typedoc-plugin-markdown.org/) - Markdown plugin documentation
- [JSDoc Reference](https://jsdoc.app/) - JSDoc tag reference
