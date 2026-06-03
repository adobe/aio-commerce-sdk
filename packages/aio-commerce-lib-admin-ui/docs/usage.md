# `@adobe/aio-commerce-lib-admin-ui` Documentation

> [!WARNING]
> **Experimental**: This package is not yet production-ready. The API may change in future releases.

## Overview

This package provides utilities for interacting with the Admin UI SDK API and the Admin UI grid column extension points:

- **[API Client](#api-client)**: Create typed HTTP clients for the Admin UI SDK API
- **[Grid Column Wire Contract](#grid-column-wire-contract)**: Request and response builders for runtime actions handling `commerce/backend-ui/2` grid column extensions

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

### Grid Column Wire Contract

Apps that declare `adminUi.<grid>.gridColumns` on the `commerce/backend-ui/2` extension point expose a runtime action that Commerce calls to fetch cell values for custom columns. This package provides typed builders for the JSON wire contract used by those handlers.

The registration side (declaring columns, runtime actions, and types) is configured through `@adobe/aio-commerce-lib-app`. The builders in this section cover the runtime handler side.

#### Parsing the incoming request

Commerce POSTs a body of the shape `{ requestId, gridType, ids }` to the handler. Use `parseGridRequest` to validate and narrow it:

```typescript
import { parseGridRequest } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";

export async function main(params: unknown) {
  const { requestId, gridType, ids } = parseGridRequest(params);
  // gridType is typed as "order" | "product" | "customer"
  // ids is string[]
  // ...
}
```

`parseGridRequest` throws a `CommerceSdkValidationError` when the input is malformed. Use `safeParseGridRequest` if you prefer an explicit `SafeParseResult` over a thrown error.

#### Building a success response

`okGridResponse` wraps your rows in the envelope Commerce expects, optionally including a `defaults` bag (serialized as the `"*"` key):

```typescript
import { okGridResponse } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";

return okGridResponse({
  rows: {
    "000000001": { fulfillment_status: "shipped", risk_score: 12 },
    "000000002": { fulfillment_status: "pending", risk_score: 47 },
  },
  defaults: { fulfillment_status: "unknown", risk_score: 0 },
});
```

Commerce applies `defaults` to IDs missing from `rows` and to individual cells whose value does not satisfy the declared `type` on the column registration. Omit `defaults` if you do not need fallback values.

The column keys inside each row must match the `columnId` values declared in the corresponding `adminUi.<grid>.gridColumns.columns[].columnId` configuration.

#### Building an error response

`errorGridResponse` produces the `{ errorStatus, errorMessage }` envelope Commerce recognises as a handler-level failure. The response is returned with HTTP status 200 so the handler can convey a specific error code Commerce can log:

```typescript
import { errorGridResponse } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";

return errorGridResponse("INTERNAL_ERROR", "Could not reach inventory service");
```
