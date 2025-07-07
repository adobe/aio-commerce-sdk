# `create-package` Generator

Turborepo generator for scaffolding new packages in the Adobe Commerce SDK monorepo.

This generator automates the creation of new packages with all necessary configuration files, ensuring consistency and adherence to project standards.

## Usage

From anywhere in the monorepo, run:

```shell
pnpm turbo gen create-package
```

## Interactive Prompts

The generator will guide you through the package creation process with the following prompts:

1. **Package name**: The name of your package (without an `@adobe/` or `@aio-commerce-sdk/` prefix)
2. **Private package**: Whether this is an internal package (not published to npm)
3. **Include tests**: Whether to scaffold test configuration and example tests

## Generated Structure

The generator creates a complete package structure:

```
packages/your-package-name/
├── source/
│   └── index.ts          # Main entry point
├── test/                 # (if tests enabled)
│   └── index.test.ts     # Example test file
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── tsdown.config.ts      # Build configuration
├── vitest.config.ts      # Test configuration (if tests enabled)
└── README.md             # Package documentation
```

## Package Types

### Public Packages

- **Naming**: `@adobe/aio-commerce-lib-{name}`
- **Published**: Yes, to NPM registry
- **Usage**: For libraries intended for external consumption
- **Example**: `@adobe/aio-commerce-lib-auth`

### Private Packages

- **Naming**: `@aio-commerce-sdk/{name}`
- **Published**: No, internal use only
- **Usage**: For shared configurations, internal tools, etc.
- **Example**: `@aio-commerce-sdk/config-typescript`

## Troubleshooting

### Package already exists

If a package with the same name already exists, the generator will fail. Choose a different name or remove the existing package first.

### Dependencies not installing

After generation, run `pnpm install` from the monorepo root to ensure all dependencies are properly linked.

### TypeScript errors

Make sure your source files are in the `source/` directory and that you're extending the base TypeScript configuration correctly.

## Related

- [Generators Package](../README.md) - Parent generators documentation
- [Development Guide](../../../.github/DEVELOPMENT.md#creating-a-new-package) - Package creation guidelines
- [TypeScript Config](../../../configs/typescript/README.md) - Base TypeScript configuration
- [TSDown Config](../../../configs/tsdown/README.md) - Build configuration
