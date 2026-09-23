# `@adobe/aio-commerce-lib-app`

App configuration management library for Adobe Commerce applications.

This library provides tools for defining, validating, and managing configurations for Adobe Commerce applications. It defines the configuration schema, provides validation, and can scaffold App Builder projects with TypeScript configuration support, build configuration, and type checking.

## Installation

```shell
npm install @adobe/aio-commerce-lib-app
```

## Usage

See the [Usage Guide](./docs/usage.md) for more information.

## Internal Entrypoints

The `@adobe/aio-commerce-lib-app/cli` entrypoint is internal. It only exists for the code this package generates (the App Builder hook files under `.generated/hooks/`), so don't import it directly. Changes to it do not follow semantic versioning.

## Contributing

This package is part of the Adobe Commerce SDK monorepo. Refer to the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for information on development setup and guidelines.
