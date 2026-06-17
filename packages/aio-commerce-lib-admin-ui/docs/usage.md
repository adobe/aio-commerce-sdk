# `@adobe/aio-commerce-lib-admin-ui` Documentation

> [!WARNING]
> **Experimental**: This package is not yet production-ready. The API may change in future releases.

## Overview

This package provides utilities for interacting with the Admin UI SDK API and the Admin UI `commerce/backend-ui/2` extension points:

- **[API Client](#api-client)**: Create typed HTTP clients for the Admin UI SDK API
- **[Grid Column Wire Contract](#grid-column-wire-contract)**: Request and response builders for runtime actions handling `commerce/backend-ui/2` grid column extensions
- **[Menu Constants](#menu-constants)**: Named constants and type guards for Commerce Admin menu IDs
- **[Order View Button Wire Contract](#order-view-button-wire-contract)**: Request and response builders for runtime actions handling `commerce/backend-ui/2` order view button extensions
- **[Permission Client](#permission-client)**: Check whether the current Commerce admin user has been granted a per-app ACL resource

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

`errorGridResponse` returns a non-2xx HTTP response. Commerce uses the status code to distinguish success from failure:

```typescript
import { errorGridResponse } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";

return errorGridResponse(500, "Could not reach inventory service");
```

### Order View Button Wire Contract

Apps that expose a runtime action handler for `commerce/backend-ui/2` order view buttons receive a POST from Commerce when the button is clicked. This package provides typed builders for that JSON wire contract.

#### Iframe buttons

Commerce does not call a server-side handler. Instead, it opens an iframe pointing at the app's web entry with the button `path` appended and `orderId` as a query parameter:

```
https://<extension-host>/index.html<path>?orderId=<orderId>
```

The app signals completion to Commerce through the UIX Host connection — calling `close()` to indicate success or `onError()` to indicate failure. Commerce then redirects back to the order view page and renders the appropriate banner notification from the registration. No SDK builders are needed for this variant.

#### Runtime action buttons

When Commerce POSTs to the app's runtime action handler, this package provides typed builders for that JSON wire contract.

##### Parsing the incoming request

Commerce POSTs a body of the shape `{ requestId, id, orderId }` to the handler. Use `parseOrderViewButtonRequest` to validate and narrow it:

```typescript
import { parseOrderViewButtonRequest } from "@adobe/aio-commerce-lib-admin-ui/order-view-buttons";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

export async function main(params: RuntimeActionParams) {
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

`orderViewButtonErrorResponse` returns an HTTP error response with a `{ message }` body. Commerce uses the HTTP status code to distinguish success from failure.

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

Return `massActionErrorResponse` when the action fails. Commerce treats any
non-2xx status as failure and surfaces the `notifications.error` message from the app
config to the user. The response body is always `{ message: string }`.

```typescript
import { massActionErrorResponse } from "@adobe/aio-commerce-lib-admin-ui/mass-actions";

return massActionErrorResponse(404, "No records matched the given IDs");
return massActionErrorResponse(500, "Could not reach the export service");
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

### Permission Client

Apps that set `adminUi.menu.aclProtected: true` in their `app.commerce.config.*` receive a dedicated per-app ACL resource node in the Commerce User Roles tree. Admins can grant or deny access to that app's menu on a per-role basis. Use `getAdminUiPermissionClient` from `@adobe/aio-commerce-lib-admin-ui/api` to check whether the current admin user holds that resource before serving menu content from a runtime action.

#### Creating a client

```typescript
import { getAdminUiPermissionClient } from "@adobe/aio-commerce-lib-admin-ui/api";

const permissionClient = getAdminUiPermissionClient({
  httpClient, // AdobeCommerceHttpClient — reuse the one from createAdminUiApiClient
  appId: "acme-promotions", // app id used to derive the ACL resource; enables no-argument check()/require(). Optional — or pass an explicit resource instead.
  cacheTtlMs: 300_000, // default: 5 min; set to 0 to disable result caching
  denyOnError: true, // default: true — returns false on network/parse errors instead of throwing
});
```

`appId` is the `metadata.id` of your application (e.g. `"acme-promotions"`). When provided, `check()` and `require()` resolve the ACL resource id automatically — no argument required.

#### Checking a permission

```typescript
// With appId set — no argument needed:
const allowed = await permissionClient.check();

// Or provide the full resource id explicitly:
const allowed = await permissionClient.check(
  "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions",
);

if (!allowed) {
  return { error: "Access denied", statusCode: 403 };
}
```

`check()` returns `true` when access is granted and `false` when denied. With `denyOnError: true` (the default) it also returns `false` on network or parse errors. It always throws `AdminUiPermissionError` on 401, regardless of `denyOnError`.

`check()` returns `false` immediately — without a network call — when neither `resource` nor a valid `appId` is available.

#### Requiring a permission

```typescript
import {
  AdminUiPermissionDeniedError,
  AdminUiPermissionError,
} from "@adobe/aio-commerce-lib-admin-ui/api";

try {
  await permissionClient.require();
  // user is allowed — proceed with the request
} catch (error) {
  if (error instanceof AdminUiPermissionDeniedError) {
    return { error: "Forbidden", statusCode: 403 };
  }
  if (error instanceof AdminUiPermissionError) {
    // 401 or network/parse error when denyOnError is false
    return { error: "Authorization error", statusCode: 401 };
  }
  throw error;
}
```

`require()` resolves when the user has access. It throws `AdminUiPermissionDeniedError` when the resource is explicitly denied, and `AdminUiPermissionError` on 401 or other failures (when `denyOnError: false`).

`require()` throws `AdminUiPermissionError` immediately — without a network call — when neither `resource` nor a valid `appId` is available.

#### Caching and deduplication

The client caches successful results for `cacheTtlMs` milliseconds (default: 5 minutes). Set `cacheTtlMs: 0` to disable result caching. Regardless of `cacheTtlMs`, **concurrent calls for the same resource share a single in-flight network request** — deduplication remains active even when caching is disabled.

Call `invalidate` to clear cached results:

```typescript
// Clear a specific resource:
permissionClient.invalidate(
  "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions",
);

// Clear all cached results and in-flight tracking:
permissionClient.invalidate();
```

#### Deriving the resource id directly

`getAclResourceId` converts a `metadata.id` value to the Commerce ACL resource id without making an HTTP request:

```typescript
import { getAclResourceId } from "@adobe/aio-commerce-lib-admin-ui/api";

const resourceId = getAclResourceId("acme-promotions");
// → "Magento_CommerceBackendUix::adminuisdk_app_acme_promotions"
```

This produces the same id that Commerce generates on the backend when `aclProtected: true` is configured. Pass it to `check()` or `require()` when you need explicit control, or use it directly for logging.

Returns an empty string when called with a blank `metadataId`; this is the same sentinel that `check()` and `require()` treat as "no resource available."

#### App-level vs menu-level resource ids

The ACL tree Commerce builds for an app is hierarchical: the **app-root** node sits above a per-item **menu leaf** node. Granting a parent node covers everything beneath it, so checking the app-root answers "can this user reach _any_ of the app's protected items", while checking the menu leaf answers "can this user reach _this specific_ menu entry".

- `getAclResourceId(metadataId)` returns the **app-root** id.
- `getMenuAclResourceId(metadataId, menuId)` returns the **menu leaf** id for a single `adminUi.menu` item, where `menuId` is its `adminUi.menu.id`.

```typescript
import {
  getAclResourceId,
  getMenuAclResourceId,
} from "@adobe/aio-commerce-lib-admin-ui/api";

getAclResourceId("approval-dashboard-app");
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app"

getMenuAclResourceId("approval-dashboard-app", "approval_dashboard");
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard"
```

Each segment is sanitized independently (trimmed, lowercased, non-`[a-z0-9_]` characters replaced with `_`), mirroring the Commerce module's id generator exactly. `getMenuAclResourceId` returns an empty string when `metadataId` is blank. Pass either id to `check()` or `require()`:

```typescript
const allowed = await permissionClient.check(
  getMenuAclResourceId("approval-dashboard-app", "approval_dashboard"),
);
```
