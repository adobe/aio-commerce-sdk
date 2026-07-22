# Adobe Commerce SDK for App Builder

A comprehensive TypeScript SDK for building Adobe Commerce integrations with Adobe App Builder.

This monorepo contains a collection of modular libraries that streamline the development of Adobe Commerce applications on the App Builder platform. Each package is designed to be used independently or combined through a [convenient meta-package](./packages/aio-commerce-sdk).

- [Adobe Commerce SDK for App Builder](#adobe-commerce-sdk-for-app-builder)
  - [Quick Start](#quick-start)
  - [Packages](#packages)
  - [Architecture](#architecture)
  - [Node.js Support](#nodejs-support)
  - [Contributing](#contributing)
  - [Resources](#resources)
  - [License](#license)
  - [Governance](#governance)

## Quick Start

```shell
# Install the complete SDK
npm install @adobe/aio-commerce-sdk

# Or install individual packages
npm install @adobe/aio-commerce-lib-auth
```

## Packages

- **[`@adobe/aio-commerce-sdk`](./packages/aio-commerce-sdk)** - Unified meta-package providing convenient access to all SDK libraries through a single import
- **[`@adobe/aio-commerce-lib-auth`](./packages/aio-commerce-lib-auth)** - Handles authentication flows for Adobe IMS and Adobe Commerce, including token management and credential validation
- **[`@adobe/aio-commerce-lib-api`](./packages/aio-commerce-lib-api)** - Provides utilities for building HTTP/API clients for Adobe Commerce and Adobe I/O Events APIs
- **[`@adobe/aio-commerce-lib-admin-ui`](./packages/aio-commerce-lib-admin-ui)** - Provides utilities for Commerce Admin UI App Builder extensions
- **[`@adobe/aio-commerce-lib-app`](./packages/aio-commerce-lib-app)** - Manages app configurations and orchestrates installation workflows (eventing and custom scripts) for Adobe Commerce applications
- **[`@adobe/aio-commerce-lib-config`](./packages/aio-commerce-lib-config)** - Manages hierarchical business configuration with scope inheritance for Adobe Commerce applications
- **[`@adobe/aio-commerce-lib-core`](./packages/aio-commerce-lib-core)** - Provides foundational utilities and shared functionality used across all `@adobe/aio-commerce-sdk` libraries
- **[`@adobe/aio-commerce-lib-events`](./packages/aio-commerce-lib-events)** - Facilitates event-driven integrations between Adobe Commerce and Adobe I/O Events
- **[`@adobe/aio-commerce-lib-webhooks`](./packages/aio-commerce-lib-webhooks)**: Webhook management utilities to interact with the Adobe Commerce Webhooks API.

## Architecture

Unlike some other languages, JavaScript/TypeScript doesn't have one unified toolchain that does everything. That's why we use many different tools for different purposes.

This project uses the following tools, find a detailed explanation/justification for each in the [development guide](./.github/DEVELOPMENT.md):

- **[PNPM](https://pnpm.io/)** - Fast, disk space efficient package manager (replacing `npm`)
- **[Turborepo](https://turbo.build/)** - High-performance build system for monorepos
- **[TypeScript](https://www.typescriptlang.org/)** - For type-safe development.
- **[TSDown](https://tsdown.dev/)** - Modern bundler specialized for TypeScript libraries.
- **[Vitest](https://vitest.dev/)** - Fast TypeScript-compatible testing framework
- **[Biome](https://biomejs.dev/)** - Fast formatter and linter

## Node.js Support

The SDK supports all Active LTS Node.js versions. The current supported range is **Node 22** and **Node 24**.

| Version | LTS start    | EOL        |
| ------- | ------------ | ---------- |
| 22      | October 2024 | April 2027 |
| 24      | October 2025 | April 2028 |

- **Adding a version:** when a Node.js version enters Active LTS (October each year), it is added to the supported range in a `minor` release.
- **Dropping a version:** when a Node.js version reaches EOL, it is removed in a dedicated `minor` release with a changelog entry noting the EOL date.

See [`specs/features/CEXT-6221-node-version-policy.md`](./specs/features/CEXT-6221-node-version-policy.md) for the full policy rationale.

### Codegen runtime default

The `runtime` field written to generated `ext.config.yaml` files defaults to the latest App Builder Runtime version with prewarm support. Prewarms reduce cold-start latency; using a runtime version without prewarm support can degrade production performance. The default is updated when a newer version gains prewarm support in App Builder Runtime.

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

## Agentic Tooling

Agentic tooling lives under [`plugins/`](./plugins/). Each plugin is independently installable and may include agent skills, MCP configurations, or other agentic content. See [`plugins/commerce/`](./plugins/commerce/README.md) for available Commerce plugins and distribution channel guidance.

## Resources

- [Adobe App Builder Documentation](https://developer.adobe.com/app-builder/docs/overview/)
- [Adobe Commerce Documentation](https://developer.adobe.com/commerce/docs/)
- [Development Guide](./.github/DEVELOPMENT.md)
- [Maintainers Guide](./.github/MAINTAINERS.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.

## Governance

This project adheres to the Adobe [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### Security

Security issues shouldn't be reported on the issue tracker. Instead, [file an issue to our security experts](https://helpx.adobe.com/security/alertus.html).
