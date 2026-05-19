# `@adobe/aio-commerce-lib-admin-ui-sdk` Documentation

## Overview

This package provides utilities for interacting with the Admin UI SDK API:

- **[Permission Checking](#permission-checking)**: Check whether the current user has access to an ACL resource, with built-in caching and request deduplication
- **[API Client](#api-client)**: Create typed HTTP clients for the Admin UI SDK API

## API Reference

For a complete list of all available types, functions, and classes, see the [API Reference](./api-reference/README.md).

## Quick Start

### Permission Checking

Use `getAdminUiSdkPermissionClient` to verify whether the current user has been granted a given ACL resource. Results are cached for 5 minutes by default, and concurrent requests for the same resource are deduplicated automatically.

```typescript
import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import { getAdminUiSdkPermissionClient } from "@adobe/aio-commerce-lib-admin-ui-sdk/api";

const httpClient = new AdobeCommerceHttpClient({
  /* CommerceHttpClientParams */
});
const permissions = getAdminUiSdkPermissionClient({ httpClient });

// Returns true if granted, false if denied or on error (fail-closed by default)
const allowed = await permissions.check("Vendor_Module::resource_name");

// Throws AdminUiSdkPermissionDeniedError if denied, or AdminUiSdkPermissionError if the check fails
await permissions.require("Vendor_Module::resource_name");

// Invalidate a cached result (e.g. after a role change)
permissions.invalidate("Vendor_Module::resource_name");

// Invalidate all cached results
permissions.invalidate();
```

By default, `check()` fails closed and returns `false` on network or response parsing errors. To opt out of fail-closed behavior for `check()` and receive the underlying error:

```typescript
const permissions = getAdminUiSdkPermissionClient({
  httpClient,
  denyOnError: false,
});
```

To adjust the cache TTL or disable caching entirely:

```typescript
const permissions = getAdminUiSdkPermissionClient({
  httpClient,
  cacheTtlMs: 60_000, // 1 minute
});

const permissionsNoCache = getAdminUiSdkPermissionClient({
  httpClient,
  cacheTtlMs: 0, // disabled
});
```

#### Error handling

```typescript
import {
  AdminUiSdkPermissionError,
  AdminUiSdkPermissionDeniedError,
} from "@adobe/aio-commerce-lib-admin-ui-sdk/api";

try {
  await permissions.require("Vendor_Module::resource_name");
} catch (error) {
  if (error instanceof AdminUiSdkPermissionDeniedError) {
    console.error(`Access denied for resource: ${error.resource}`);
  } else if (error instanceof AdminUiSdkPermissionError) {
    // Unauthorized, network, or response parsing error
    console.error("Permission check failed", error);
  }
}
```

### API Client

Use `createAdminUiSdkApiClient` for full access to the Admin UI SDK API:

```typescript
import { createAdminUiSdkApiClient } from "@adobe/aio-commerce-lib-admin-ui-sdk/api";

const client = createAdminUiSdkApiClient({
  baseUrl: "https://commerce.example.com",
  // ...other CommerceHttpClientParams
});
```

In install/uninstall actions where only a subset of operations is needed, prefer `createCustomAdminUiSdkApiClient` to keep the bundle lean:

```typescript
import {
  createCustomAdminUiSdkApiClient,
  registerExtension,
  unregisterExtension,
} from "@adobe/aio-commerce-lib-admin-ui-sdk/api";

const client = createCustomAdminUiSdkApiClient(params, {
  registerExtension,
  unregisterExtension,
});
```
