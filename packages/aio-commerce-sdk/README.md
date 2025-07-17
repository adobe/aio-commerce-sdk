# `@adobe/aio-commerce-sdk`

> [!WARNING]
> This package is a work in progress and is not yet ready for use yet. You may be able to install it, but if you do, expect breaking changes.

Meta-package that re-exports Adobe Commerce SDK libraries for Adobe App Builder applications.

This package serves as a convenient entry point for accessing commonly used Adobe Commerce libraries in App Builder projects, similar to how [`@adobe/aio-sdk`](https://github.com/adobe/aio-sdk) works for general App Builder development.

## Installation

```shell
pnpm install @adobe/aio-commerce-sdk
```

## Overview

The `@adobe/aio-commerce-sdk` is a meta-package that consolidates and re-exports the most commonly used Adobe Commerce libraries for App Builder applications. Rather than installing and importing multiple individual packages, you can use this single package to access all the essential Commerce functionality.

### Current Libraries

The SDK currently includes:

- **[@adobe/aio-commerce-lib-auth](https://github.com/adobe/aio-commerce-sdk/tree/main/packages/aio-commerce-lib-auth)**: Authentication utilities for Adobe Commerce apps, supporting both IMS and Commerce integrations authentication.

## Usage

You can import libraries from the SDK in two ways:

### 1. Direct Sub-path Import (Recommended)

Import directly from a specific library sub-path for better tree-shaking:

```typescript
import {
  assertImsAuthParams,
  getImsAuthProvider,
  assertIntegrationAuthParams,
  getIntegrationAuthProvider,
} from "@adobe/aio-commerce-sdk/auth";

// Validate and create IMS auth provider
assertImsAuthParams(params);
const imsAuth = getImsAuthProvider(params);

// Validate and create integration auth provider
assertIntegrationAuthParams(params);
const integrationsAuth = getIntegrationAuthProvider(params);
```

### 2. Namespaced Import

Import all exports from a specific library under a namespace:

```typescript
import { Auth } from "@adobe/aio-commerce-sdk";

// Use IMS authentication
Auth.assertImsAuthParams(params);
const imsAuth = Auth.getImsAuthProvider(params);
const headers = await imsAuth.getHeaders();
```

```typescript
import { Auth } from "@adobe/aio-commerce-sdk";

// Use integrations authentication
Auth.assertIntegrationAuthParams(params);
const integrationsAuth = Auth.getIntegrationAuthProvider(params);
const headers = integrationsAuth.getHeaders("GET", "https://example.com/api");
```

## Benefits

- **Simplified dependency management**: Install one package instead of multiple individual libraries
- **Consistent versioning**: All included libraries are tested together for compatibility
- **Better developer experience**: Single import source for common Commerce functionality
- **Tree-shaking support**: Both import patterns support dead code elimination
- **Type safety**: Full TypeScript support with type definitions included

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.

Refer to this section of the development guide if you want to add your library to the SDK: [Add it to the SDK (optional)](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md#add-it-to-the-sdk-optional)
