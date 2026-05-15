---
title: Architecture
description: Overview of the Adobe Commerce SDK package structure and how the libraries relate to each other.
---

## Package overview

The SDK is a pnpm monorepo containing modular libraries that can be used independently or together. Each package has a single responsibility:

| Package                            | Responsibility                                                           |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `@adobe/aio-commerce-sdk`          | Meta-package — re-exports all libraries through one import               |
| `@adobe/aio-commerce-lib-auth`     | Authentication: IMS OAuth and Commerce integration OAuth 1.0a            |
| `@adobe/aio-commerce-lib-api`      | HTTP clients for Commerce and I/O Events, plus an API client builder     |
| `@adobe/aio-commerce-lib-app`      | App configuration, artifact generation, and installation orchestration   |
| `@adobe/aio-commerce-lib-config`   | Hierarchical business configuration with scope inheritance               |
| `@adobe/aio-commerce-lib-core`     | Shared utilities: errors, action responses, parameter and header helpers |
| `@adobe/aio-commerce-lib-events`   | Commerce and I/O Events API clients for event-driven integrations        |
| `@adobe/aio-commerce-lib-webhooks` | Commerce Webhooks API client and typed webhook response builders         |

## Dependency graph

`aio-commerce-lib-core` is the only package with no SDK-internal dependencies. All other packages may depend on it for shared error types and utility functions.

`aio-commerce-lib-auth` builds on `aio-commerce-lib-core` and provides authentication providers used by `aio-commerce-lib-api`, `aio-commerce-lib-events`, and `aio-commerce-lib-webhooks`.

`aio-commerce-lib-api` builds on both `aio-commerce-lib-core` and `aio-commerce-lib-auth` to provide the HTTP clients consumed by `aio-commerce-lib-events` and `aio-commerce-lib-webhooks`.

`aio-commerce-lib-app` and `aio-commerce-lib-config` are higher-level libraries that build on the foundational packages to support full application lifecycle management.

## Toolchain

| Tool                                          | Purpose                                             |
| --------------------------------------------- | --------------------------------------------------- |
| [pnpm](https://pnpm.io/)                      | Package manager with workspace support              |
| [Turborepo](https://turbo.build/)             | Monorepo build orchestration with caching           |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development across all packages           |
| [TSDown](https://tsdown.dev/)                 | Library bundler — generates both ESM and CJS output |
| [Vitest](https://vitest.dev/)                 | Unit and integration testing                        |
| [Biome](https://biomejs.dev/)                 | Formatting and linting                              |

## Source conventions

- All source is ESM (`import`/`export`). TSDown compiles dual ESM + CJS output automatically.
- Each package exposes multiple subpath exports (e.g. `@adobe/aio-commerce-lib-auth`, `@adobe/aio-commerce-lib-api/commerce`, `@adobe/aio-commerce-lib-api/io-events`) for optimal tree-shaking.
- Validation is done with [valibot](https://valibot.dev/); HTTP requests use [ky](https://github.com/sindresorhus/ky).
