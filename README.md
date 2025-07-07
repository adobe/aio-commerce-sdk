# Adobe Commerce SDK for App Builder

A comprehensive TypeScript SDK for building Adobe Commerce integrations with Adobe App Builder.

This monorepo contains a collection of modular libraries that streamline the development of Adobe Commerce applications on the App Builder platform. Each package is designed to be used independently or combined through a [convenient meta-package](./packages/aio-commerce-sdk).

- [Adobe Commerce SDK for App Builder](#adobe-commerce-sdk-for-app-builder)
  - [Quick Start](#quick-start)
  - [Packages](#packages)
  - [Architecture](#architecture)
  - [Contributing](#contributing)
  - [Resources](#resources)
  - [License](#license)
  - [Governance](#governance)

## Quick Start

```shell
# Install the complete SDK
pnpm install @adobe/aio-commerce-sdk

# Or install individual packages
pnpm install @adobe/aio-commerce-lib-auth
```

## Packages

### Published Packages

> [!WARNING]
> Not published yet, this is a work in progress.

- **[`@adobe/aio-commerce-sdk`](./packages/aio-commerce-sdk)** - Meta-package that re-exports all SDK libraries
- **[`@adobe/aio-commerce-lib-auth`](./packages/aio-commerce-lib-auth)** - Authentication utilities for IMS and Commerce integrations

### Internal Packages

- **[`@aio-commerce-sdk/config-typescript`](./configs/typescript)** - Shared TypeScript configuration
- **[`@aio-commerce-sdk/config-tsdown`](./configs/tsdown)** - Shared build configuration
- **[`@aio-commerce-sdk/generators`](./turbo/generators)** - Code generators for scaffolding

## Architecture

This project is built with modern tooling and best practices:

- **[PNPM](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[Turborepo](https://turbo.build/)** - High-performance build system for monorepos
- **[TypeScript](https://www.typescriptlang.org/)** - For type-safe development.
- **[TSDown](https://tsdown.dev/)** - Modern bundler specialized for TypeScript libraries..
- **[Vitest](https://vitest.dev/)** - Fast TypeScript-compatible testing framework
- **[Biome](https://biomejs.dev/)** - Fast formatter and linter

## Contributing

We warmly welcome contributions! This project features a [**comprehensive development guide**](./.github/DEVELOPMENT.md) that covers everything you need to know:

The guide includes detailed information about:

- **Project Standards** - TypeScript, ESM modules, documentation guidelines
- **Development Setup** - Prerequisites, installation, editor configuration
- **Package Creation** - Using generators to scaffold new packages
- **Testing** - Writing and running tests with Vitest
- **Building & Publishing** - Configuring builds and preparing releases
- **Release Process** - Using changesets for version management

See also the [Contributing Guide](./.github/CONTRIBUTING.md) for more information on contributing guidelines.

## Resources

- [Adobe App Builder Documentation](https://developer.adobe.com/app-builder/docs/overview/)
- [Adobe Commerce Documentation](https://developer.adobe.com/commerce/docs/)
- [Development Guide](./.github/DEVELOPMENT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.

## Governance

This project adheres to the Adobe [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### Security

Security issues shouldn't be reported on the issue tracker. Instead, [file an issue to our security experts](https://helpx.adobe.com/security/alertus.html).
