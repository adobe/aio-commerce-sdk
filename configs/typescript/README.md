# `@aio-commerce-sdk/config-typescript`

Shared TypeScript configuration for the Adobe Commerce SDK monorepo.

This internal package provides a consistent TypeScript configuration that all packages in the monorepo should extend from, ensuring type safety and consistent compiler behavior across the project.

## Overview

This configuration package provides a base `tsconfig.json` that:

- Extends recommended TypeScript configurations
- Targets the latest LTS Node.js version
- Enables strict type checking
- Configures module resolution for modern bundlers
- Sets up appropriate compiler options for library development

## Installation

This is a private package used internally within the monorepo. It's automatically included when you create a new package using the `create-package` generator.

```json
{
  "devDependencies": {
    "@aio-commerce-sdk/config-typescript": "workspace:*"
  }
}
```

## Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@aio-commerce-sdk/config-typescript/tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./source",
    "outDir": "./dist"
  }
}
```

## Base Configuration

The base configuration extends from:

- `@tsconfig/recommended` - Recommended settings for modern TypeScript
- `@tsconfig/node-lts` - Settings optimized for Node.js LTS
- `@tsconfig/node-ts` - Additional Node.js TypeScript configurations

### Key Compiler Options

```json
{
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": false,
    "noImplicitThis": true,
    "removeComments": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true
  }
}
```

## Customization

While the base configuration should work for most packages, you can override specific options:

```jsonc
{
  "extends": "@aio-commerce-sdk/config-typescript/tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./source",
    "outDir": "./dist",

    // Enable decorators if needed
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    // Stricter options
    "noUnusedLocals": true,
    "noUnusedParameters": true,
  },
}
```

## Best Practices

1. **Always extend the base config** to maintain consistency
2. **Don't disable strict checks** unless absolutely necessary
3. **Keep source files in a `source/` directory** for clarity
4. **Exclude test files** from the build output
5. **Use `rootDir` and `outDir`** to control input/output structure

## Troubleshooting

### Module Resolution Issues

If you encounter module resolution problems, ensure:

- Your `package.json` has `"type": "module"`
- You're using proper ESM imports (with file extensions where needed)
- The `moduleResolution` is set to `"bundler"`

### Build vs Runtime Types

Remember that this configuration is primarily for type checking. The actual build is handled by [TSDown](../tsdown/README.md), which may have different settings for output generation.

## Related

- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - Official TypeScript docs
- [Contributing Guide](../../.github/CONTRIBUTING.md#typescript) - TypeScript guidelines
