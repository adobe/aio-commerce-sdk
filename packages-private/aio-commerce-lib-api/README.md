# `@aio-commerce-sdk/aio-commerce-lib-api`

> [!WARNING]
> This is a private package intended for internal use within the Adobe Commerce SDK monorepo only.

A set of utilities to build HTTP/API clients for Adobe I/O Events and Adobe Commerce APIs.

This library provides a unified interface for building HTTP clients that can communicate with Adobe Commerce (both SaaS and PaaS) and Adobe I/O Events APIs, with built-in authentication support and a flexible API function binding system.

## Installation

Since this is a private package, it's only available within the monorepo:

> [!WARNING]
> If you're using it in a published package, it should be installed as a `devDependency` in your project. Then bundle it into your public package code via TSDown. See how this is done in the [`@aio-commerce-lib-events`](../../packages/aio-commerce-lib-events/tsdown.config.ts) package.

```json
{
  "devDependencies": {
    "@aio-commerce-sdk/aio-commerce-lib-api": "workspace:*"
  }
}
```

## Usage

See the [Usage Guide](./docs/usage.md) for more information.

## Architecture

The library is built on top of [Ky](https://github.com/sindresorhus/ky), a modern HTTP client based on Fetch API, providing:

- Automatic retries with exponential backoff
- Request/response hooks
- Timeout support
- JSON parsing
- Error handling

The authentication layer integrates seamlessly with `@adobe/aio-commerce-lib-auth`, automatically handling:

- OAuth 1.0a signatures for PaaS instances
- Bearer token authentication for SaaS instances
- IMS token management and refresh

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.
