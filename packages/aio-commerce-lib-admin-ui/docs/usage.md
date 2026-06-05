# `@adobe/aio-commerce-lib-admin-ui` Documentation

> [!WARNING]
> **Experimental**: This package is not yet production-ready. The API may change in future releases.

## Overview

This package provides utilities for interacting with the Admin UI SDK API:

- **[API Client](#api-client)**: Create typed HTTP clients for the Admin UI SDK API
- **[Permission Checking](#permission-checking)**: Check whether the current user has access to an ACL resource, with built-in caching and request deduplication

## API Reference

For a complete list of all available types, functions, and classes, see the [API Reference](./api-reference/README.md).

## Quick Start

### API Client

Use `createAdminUiApiClient` to register and unregister Admin UI SDK extensions with Commerce:

```typescript
import { createAdminUiApiClient } from "@adobe/aio-commerce-lib-admin-ui/api";

const client = createAdminUiApiClient({
  config: {
    baseUrl: "https://my-commerce-instance.com",
    flavor: "paas", // or "saas"
  },
  auth: {
    /* IMS or Integration auth params */
  },
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

### Permission Checking

Use `getAdminUiPermissionClient` to verify whether the current user has been granted a given Admin UI SDK ACL resource. Results are cached for 5 minutes by default, and concurrent requests for the same resource are deduplicated automatically.

```typescript
import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import { getAdminUiPermissionClient } from "@adobe/aio-commerce-lib-admin-ui/api";

const httpClient = new AdobeCommerceHttpClient({
  /* CommerceHttpClientParams */
});
const permissions = getAdminUiPermissionClient({ httpClient });

// Returns true if granted, false if denied or on error (fail-closed by default)
const allowed = await permissions.check("Vendor_Module::resource_name");

// Throws AdminUiPermissionDeniedError if denied, or AdminUiPermissionError if the check fails
await permissions.require("Vendor_Module::resource_name");

// Invalidate a cached result (e.g. after a role change)
permissions.invalidate("Vendor_Module::resource_name");

// Invalidate all cached results
permissions.invalidate();
```

By default, `check()` fails closed and returns `false` on network or response parsing errors. To opt out of fail-closed behavior for `check()` and receive the underlying error:

```typescript
const permissions = getAdminUiPermissionClient({
  httpClient,
  denyOnError: false,
});
```

To adjust the cache TTL or disable caching entirely:

```typescript
const permissions = getAdminUiPermissionClient({
  httpClient,
  cacheTtlMs: 60_000, // 1 minute
});

const permissionsNoCache = getAdminUiPermissionClient({
  httpClient,
  cacheTtlMs: 0, // disabled
});
```

#### Error handling

```typescript
import {
  AdminUiPermissionError,
  AdminUiPermissionDeniedError,
} from "@adobe/aio-commerce-lib-admin-ui/api";

try {
  await permissions.require("Vendor_Module::resource_name");
} catch (error) {
  if (error instanceof AdminUiPermissionDeniedError) {
    console.error(`Access denied for resource: ${error.resource}`);
  } else if (error instanceof AdminUiPermissionError) {
    // Unauthorized, network, or response parsing error
    console.error("Permission check failed", error);
  }
}
```
