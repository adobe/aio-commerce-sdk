# `@adobe/aio-commerce-lib-admin-ui` Documentation

> [!WARNING]
> **Experimental**: This package is not yet production-ready. The API may change in future releases.

## Overview

This package provides utilities for interacting with the Admin UI SDK API and the Admin UI `commerce/backend-ui/2` extension points:

- **[API Client](#api-client)**: Create typed HTTP clients for the Admin UI SDK API
- **[Grid Column Wire Contract](#grid-column-wire-contract)**: Request and response builders for runtime actions handling `commerce/backend-ui/2` grid column extensions
- **[Order View Button Wire Contract](#order-view-button-wire-contract)**: Runtime model for `commerce/backend-ui/2` order view buttons — iframe navigation contract for `type: "view"` and request/response builders for `type: "worker"` handlers
- **[Menu Constants](#menu-constants)**: Named constants and type guards for Commerce Admin menu IDs

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

`parseGridRequest` throws a `CommerceSdkValidationError` when the input is malformed.

#### Building a success response

`okGridResponse` wraps your data in the envelope Commerce expects, optionally including a `defaults` bag (serialized as the `"*"` key):

```typescript
import { okGridResponse } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";

return okGridResponse(
  {
    "000000001": { fulfillment_status: "shipped", risk_score: 12 },
    "000000002": { fulfillment_status: "pending", risk_score: 47 },
  },
  { fulfillment_status: "unknown", risk_score: 0 },
);
```

Commerce applies the second argument (defaults) to IDs missing from `data` and to individual cells whose value does not satisfy the declared `type` on the column registration. Omit it if you do not need fallback values.

The column keys inside each row must match the `id` values declared in the corresponding `adminUi.<grid>.gridColumns.columns[].id` configuration.

#### Building an error response

`errorGridResponse` produces the `{ errorStatus, errorMessage }` envelope Commerce recognises as a handler-level failure. The response is returned with HTTP status 200 so the handler can convey a specific error code Commerce can log:

```typescript
import { errorGridResponse } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";

return errorGridResponse("INTERNAL_ERROR", "Could not reach inventory service");
```

### Order View Button Wire Contract

`adminUi.order.viewButtons` supports two variants with different runtime models. The registration side (declaring buttons and their configuration) is handled through `@adobe/aio-commerce-lib-app`.

#### type: "view" — iframe buttons

Commerce does not call a server-side handler. Instead, it opens an iframe pointing at the app's web entry with the button `path` appended and `orderId` as a query parameter:

```
https://<extension-host>/index.html<path>?orderId=<orderId>
```

The app signals completion to Commerce through the UIX Host connection — calling `close()` to indicate success or `onError()` to indicate failure. Commerce then redirects back to the order view page and renders the appropriate banner notification from the registration. No SDK builders are needed for this variant.

#### type: "worker" — runtime action buttons

Apps that declare `type: "worker"` entries expose a runtime action that Commerce POSTs to when the button is clicked. This package provides typed builders for that JSON wire contract.

##### Parsing the incoming request

Commerce POSTs a body of the shape `{ requestId, id, orderId }` to the handler. Use `parseOrderViewButtonRequest` to validate and narrow it:

```typescript
import { parseOrderViewButtonRequest } from "@adobe/aio-commerce-lib-admin-ui/order-view-buttons";

export async function main(params: unknown) {
  const { requestId, id, orderId } = parseOrderViewButtonRequest(params);
  // id identifies which button was clicked — useful when one handler serves multiple buttons
  // orderId is the order currently being viewed
  // ...
}
```

`parseOrderViewButtonRequest` throws a `CommerceSdkValidationError` when the input is malformed.

##### Building a success response

`okOrderViewButtonResponse` returns the empty-object body Commerce expects on success:

```typescript
import { okOrderViewButtonResponse } from "@adobe/aio-commerce-lib-admin-ui/order-view-buttons";

return okOrderViewButtonResponse();
```

Commerce renders `notifications.success` from the registration as the toast body when present, and a default success toast otherwise.

##### Building an error response

`orderViewButtonErrorResponse` returns an HTTP error response with a `{ error }` body. Commerce uses the HTTP status code to distinguish success from failure.

```typescript
import { orderViewButtonErrorResponse } from "@adobe/aio-commerce-lib-admin-ui/order-view-buttons";

return orderViewButtonErrorResponse(500, "Could not reach inventory service");
```

### Mass Action Worker Contract

Apps that declare `adminUi.<entity>.massActions` with `type: "worker"` expose a runtime
action that Commerce calls when the user triggers the action on a selection of records.
Commerce POSTs a JSON body and uses the HTTP status code to distinguish success from
failure. This section covers the handler side.

#### Parsing the incoming request

Use `parseMassActionRequest` to validate and narrow the incoming body:

```typescript
import { parseMassActionRequest } from "@adobe/aio-commerce-lib-admin-ui/mass-actions";

export async function main(params: unknown) {
  const { requestId, gridType, ids } = parseMassActionRequest(params);
  // gridType is "order" | "product" | "customer"
  // ids is string[] with at least one entry
}
```

Throws `CommerceSdkValidationError` when the input is malformed.

#### Building a success response

Return `okMassActionResponse` when the action completes. Commerce treats HTTP 200 as
success. Optionally include any fields you need for logging:

```typescript
import { okMassActionResponse } from "@adobe/aio-commerce-lib-admin-ui/mass-actions";

return okMassActionResponse();
return okMassActionResponse({ exported: ids.length });
```

#### Building an error response

Return one of the typed error builders when the action fails. Commerce treats any
non-2xx status as failure and surfaces the `notifications.error` message from the app
config to the user. The response body is always `{ error: string }`.

| Builder                                 | Status |
| --------------------------------------- | ------ |
| `badRequestMassActionResponse`          | 400    |
| `unauthorizedMassActionResponse`        | 401    |
| `forbiddenMassActionResponse`           | 403    |
| `notFoundMassActionResponse`            | 404    |
| `internalServerErrorMassActionResponse` | 500    |

```typescript
import {
  internalServerErrorMassActionResponse,
  notFoundMassActionResponse,
} from "@adobe/aio-commerce-lib-admin-ui/mass-actions";

return notFoundMassActionResponse("No records matched the given IDs");
return internalServerErrorMassActionResponse(
  "Could not reach the export service",
);
```

### Menu Constants

The `./menu` entrypoint provides named constants for Commerce Admin menu IDs, typed collections of those IDs, and type guards for distinguishing menu IDs at runtime.

#### Named constants

Each top-level menu and its sub-menus are available as named exports:

```typescript
import {
  MENU_SALES,
  MENU_CATALOG,
  MENU_CUSTOMERS,
  MENU_MARKETING,
} from "@adobe/aio-commerce-lib-admin-ui/menu";
```

#### Collection

`COMMERCE_MENUS` is a readonly tuple of all supported Commerce Admin menu IDs:

```typescript
import { COMMERCE_MENUS } from "@adobe/aio-commerce-lib-admin-ui/menu";
```

#### Type guard

`isCommerceMenu` narrows an arbitrary string to the `CommerceMenu` type:

```typescript
import { isCommerceMenu } from "@adobe/aio-commerce-lib-admin-ui/menu";

if (isCommerceMenu(id)) {
  // id is CommerceMenu
}
```
