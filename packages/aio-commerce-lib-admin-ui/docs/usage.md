# `@adobe/aio-commerce-lib-admin-ui` Documentation

> [!WARNING]
> **Experimental**: This package is not yet production-ready. The API may change in future releases.

## Overview

This package provides utilities for interacting with the Admin UI SDK API:

- **[API Client](#api-client)**: Create typed HTTP clients for the Admin UI SDK API

## API Reference

For a complete list of all available types, functions, and classes, see the [API Reference](./api-reference/README.md).

## Quick Start

### API Client

Use `createAdminUiSdkApiClient` to register and unregister Admin UI SDK extensions with Commerce:

```typescript
import { createAdminUiSdkApiClient } from "@adobe/aio-commerce-lib-admin-ui/api";

const client = createAdminUiSdkApiClient({
  baseUrl: "https://commerce.example.com",
  // ...other CommerceHttpClientParams
});

// Register an extension
await client.registerExtension({
  extensionName: "my_namespace",
  extensionTitle: "My App",
  extensionUrl: "https://my_namespace.adobeio-static.net/index.html",
  extensionWorkspace: "prod-workspace",
});

// Unregister an extension
await client.unregisterExtension({
  workspaceName: "prod-workspace",
  extensionName: "my_namespace",
});
```
