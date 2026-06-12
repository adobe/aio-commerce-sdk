# Admin UI grid column extensions (v2)

- **Ticket:** [CEXT-6096](https://jira.corp.adobe.com/browse/CEXT-6096)
- **Created:** 2026-05-29
- [x] **Implemented**

> **Deprecation notice.** The v1 grid column schema (`commerce/backend-ui/1`, `data.meshId`,
> `properties`, `columnId`) is deprecated and will be removed from the SDK in a future release.
> New apps must use `adminUi` and `commerce/backend-ui/2`. Existing apps should migrate —
> see [Migration from v1](#migration-from-v1) below.

## Summary

The SDK introduces a v2 Admin UI grid column schema under the new `adminUi` config key, covering
order, product, and customer grids on `commerce/backend-ui/2`. The v1 schema (`adminUiSdk`,
`commerce/backend-ui/1`, `data.meshId`, `properties`, `columnId`, `float` type) is deprecated and
will be removed in a future release — it remains functional for now. The v2 shape introduces
`runtimeAction` (a `workerProcess` operation name resolved by App Registry at runtime), `columns`
(replacing `properties`), and `id` (renamed from `columnId` in v1). The wire contract between Commerce and
the handler is formally standardized for the first time. No separate registration action is
generated for `commerce/backend-ui/2` — Commerce reads the `adminUi` config directly from the
existing `app-config` endpoint on `commerce/extensibility/1`.

## Motivation

The v1 grid column design has four concrete problems that compound each other:

1. **Mesh is required even for trivial cases.** An app that fetches one extra column from its own
   database must configure and reference an API Mesh gateway — the SDK offers no direct path.
2. **`meshId` is opaque and environment-specific.** It is a hash produced by `aio api-mesh:describe`.
   Each deployment environment (dev, stage, prod) has a different ID; the SDK config has no mechanism
   to express this, so developers either hard-code one environment's ID or work around the problem
   entirely outside the SDK.
3. **The wire contract is undocumented.** Handlers had to parse `?ids=a,b,c` as a comma-joined query
   string, know that the returned object key was `orderGridColumns` (not `customerGridColumns`, not a
   generic name), and discover the `"*"` wildcard default behavior from source code. None of this was
   specified anywhere in the SDK.
4. **Order, product, and customer grids are architecturally identical but treated as three separate
   concerns.** Three pages of documentation and three schema branches describe the same pattern.

**Goals**

- Introduce `adminUi` as the new top-level config key for `commerce/backend-ui/2` registrations.
- Replace `data.meshId` with `runtimeAction` (a `workerProcess` operation name) in all three grids.
- Rename `properties` → `columns`; rename `columnId` → `id`.
- Add `label` and `description` to each `gridColumns` block for display during installation.
- Formally specify the request/response wire contract.
- Deprecate `adminUiSdk`/`commerce/backend-ui/1` grid columns; keep them functional until removal.
- Use a single unified column schema under `order.gridColumns`, `product.gridColumns`, and
  `customer.gridColumns`.

**Non-goals**

- Removing `commerce/backend-ui/1` or `adminUiSdk` in this release — removal is deferred to a future
  breaking release.
- Adding grid targets beyond order, product, and customer.
- Implementing mass action v2 (separate ticket).
- Wrapping or managing the Commerce API Mesh service.
- Creating app-management or app-migration plugin skills for scaffolding or migrating grid column extensions — handled in a separate scope.

## Developer experience

### Defining grid columns

The config shape is the same across all three grids:

```ts
// app.commerce.config.ts
export default defineConfig({
  adminUi: {
    order: {
      gridColumns: {
        label: "Order fulfillment data",
        description: "Adds fulfillment status and risk score to the order grid",
        runtimeAction: "orders/fetch-order-grid-data",
        columns: [
          {
            id: "fulfillment_status",
            label: "Fulfillment",
            type: "string",
            align: "left",
          },
          {
            id: "risk_score",
            label: "Risk",
            type: "integer",
            align: "right",
          },
        ],
      },
    },
    product: {
      gridColumns: {
        label: "Product inventory data",
        description: "Adds inventory status to the product grid",
        runtimeAction: "products/fetch-product-grid-data",
        columns: [
          {
            id: "inventory_status",
            label: "Inventory",
            type: "string",
            align: "left",
          },
        ],
      },
    },
    customer: {
      gridColumns: {
        label: "Customer loyalty data",
        description: "Adds loyalty tier to the customer grid",
        runtimeAction: "customers/fetch-customer-grid-data",
        columns: [
          {
            id: "loyalty_tier",
            label: "Loyalty Tier",
            type: "string",
            align: "left",
          },
        ],
      },
    },
  },
});
```

Note: unlike `adminUiSdk`, the `adminUi` key does **not** have a `registration` wrapper. Grid
column blocks are declared directly under `order`, `product`, and `customer`.

The SDK generates the `workerProcess` operation declarations in `ext.config.yaml` automatically
from the `runtimeAction` values — developers do not write them by hand. The only thing the
developer needs to provide alongside the config is the handler implementation itself (e.g.
`orders/fetch-order-grid-data.js`). App Registry resolves the operation name to the deployed
runtime action URL when Commerce fetches the extension.

Commerce reads the `adminUi` registration config from the `app-config` endpoint on
`commerce/extensibility/1` — no additional runtime action is needed on `commerce/backend-ui/2`.
The only artifact generated for `commerce/backend-ui/2` is the `ext.config.yaml` that declares
the `workerProcess` operations.

### Wire contract

**Request** (sent by Commerce to the handler):

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "gridType": "order",
  "ids": ["000000001", "000000002", "000000003"]
}
```

- `ids` is a real array. v1 sent `?ids=a,b,c` as a comma-joined query string — this changes.
- `gridType` is `"customer" | "order" | "product"`. A single handler can serve multiple grids
  by branching on it, or a developer can write one handler per grid.
- Commerce chunks to a maximum of 1000 IDs per request. Handlers do not need to implement chunking.

**Success response:**

```json
{
  "data": {
    "000000001": { "fulfillment_status": "shipped", "risk_score": 12 },
    "000000002": { "fulfillment_status": "pending", "risk_score": 47 },
    "*": { "fulfillment_status": "unknown", "risk_score": 0 }
  }
}
```

- Each row is keyed by the matching grid ID.
- The `"*"` key supplies default cell values for IDs absent from the response and for cells whose
  returned value does not satisfy the declared `type`. It is not a failure fallback.
- Per-cell type mismatches fall back to `"*"`, then to empty if `"*"` is absent.

**Failure response:**

```json
{
  "errorStatus": "INTERNAL_ERROR",
  "errorMessage": "Could not reach inventory service"
}
```

### id uniqueness

`id` values are declared by the developer as plain identifiers (e.g. `external_id`). The
`app-config` endpoint serves them as-is; no SDK-side prefixing is applied. `id` collision
handling across multiple installed apps is Commerce's responsibility.

### Column types

| `type` value | Description              |
| ------------ | ------------------------ |
| `boolean`    | Boolean value            |
| `date`       | Date (no time component) |
| `datetime`   | Date and time            |
| `float`      | Floating-point number    |
| `integer`    | Integer                  |
| `string`     | Text                     |

### Migration from v1

| v1                                       | v2                           | Notes                                                         |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| `adminUiSdk.registration.order`          | `adminUi.order`              | No `registration` wrapper in v2                               |
| `data.meshId`                            | `runtimeAction`              | Operation name declared in `app.config.yaml`, not a Mesh hash |
| `properties`                             | `columns`                    | Array of column declarations                                  |
| `properties[].columnId`                  | `columns[].id`               | Renamed                                                       |
| `properties[].type: "float"`             | `columns[].type: "float"`    | Same type name                                                |
| _(absent)_                               | `columns[].type: "datetime"` | New type in v2                                                |
| _(absent)_                               | `label`, `description`       | New block-level metadata for App Management installation UI   |
| Extension point: `commerce/backend-ui/1` | `commerce/backend-ui/2`      | Required change in `app.config.yaml` and `install.yaml`       |

v1 continues to work after migration — both keys can coexist in the same config during transition.
Once all grid columns have been migrated to `adminUi`, the `adminUiSdk` grid column config can be
removed.

## Design

### Two config keys, two extension points

`adminUiSdk` and `adminUi` are independent top-level keys in `defineConfig()`. They map to separate
extension points with different generated artifacts:

| Config key   | Extension point         | Generated artifact                                       | Status                       |
| ------------ | ----------------------- | -------------------------------------------------------- | ---------------------------- |
| `adminUiSdk` | `commerce/backend-ui/1` | `registration/index.js` + `ext.config.yaml`              | Deprecated — will be removed |
| `adminUi`    | `commerce/backend-ui/2` | `ext.config.yaml` with `workerProcess` declarations only | Current                      |

For `adminUi`, no registration action is generated. Commerce reads the `adminUi` config directly
from the `app-config` endpoint on `commerce/extensibility/1`, which already includes the full app
manifest. Both keys are optional and can coexist.

### Schema

The v2 schema lives in a dedicated file:

`packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts`

```ts
const GridColumnSchema = v.object({
  id: nonEmptyStringValueSchema("column ID"),
  label: nonEmptyStringValueSchema("column label"),
  type: v.picklist([
    "boolean",
    "date",
    "datetime",
    "float",
    "integer",
    "string",
  ]),
  align: v.picklist(["left", "right", "center"]),
});

const GridColumnsSchema = v.object({
  label: nonEmptyStringValueSchema("grid columns label"),
  description: nonEmptyStringValueSchema("grid columns description"),
  runtimeAction: nonEmptyStringValueSchema("runtime action"),
  columns: v.pipe(
    v.array(GridColumnSchema),
    v.minLength(1, "At least one column is required"),
  ),
});

export const AdminUiSchema = v.object({
  order: v.optional(v.object({ gridColumns: v.optional(GridColumnsSchema) })),
  product: v.optional(v.object({ gridColumns: v.optional(GridColumnsSchema) })),
  customer: v.optional(
    v.object({ gridColumns: v.optional(GridColumnsSchema) }),
  ),
});
```

The v1 schema in `admin-ui-sdk.ts` is unchanged. Its `GridColumnsSchema` (with `data.meshId` and
`properties`) and the `gridColumns` field on `OrderExtensionPointsSchema`,
`ProductExtensionPointsSchema`, and `CustomerExtensionPointsSchema` remain in place. The exported
v1 type is `AdminUiSdkGridColumns` (marked `@deprecated`).

### Extension point constants

`packages/aio-commerce-lib-app/source/commands/constants.ts`

Both constants coexist:

```ts
export const BACKEND_UI_EXTENSION_POINT_ID = "commerce/backend-ui/1"; // v1, deprecated
export const BACKEND_UI_V2_EXTENSION_POINT_ID = "commerce/backend-ui/2"; // v2
```

### Pre-app-build hook

`packages/aio-commerce-lib-app/source/commands/hooks/pre-app-build.ts`

The `Extension` union includes both values. Each routes to its own handler:

- `"backend-ui/1"` → `generateRegistrationActionFile` (v1, unchanged behavior)
- `"backend-ui/2"` → `updateExtConfig` (v2)

When `hasAdminUi` is true, the v2 path performs one generation step:

**`ext.config.yaml` workerProcess declarations** — collects all unique `runtimeAction` values
across `order`, `product`, and `customer` grid column configs, then writes them as `workerProcess`
entries in `ext.config.yaml` for `commerce/backend-ui/2`. No registration action is generated;
Commerce reads the `adminUi` config directly from the `app-config` endpoint on
`commerce/extensibility/1`. Developers do not declare `workerProcess` entries manually; the SDK
derives them from `app.commerce.config.ts` and keeps `ext.config.yaml` in sync on every build.

Example generated `ext.config.yaml` for the config above:

```yaml
hooks:
  pre-app-build: "EXTENSION=backend-ui/2 $packageExec aio-commerce-lib-app hooks pre-app-build"
operations:
  workerProcess:
    - type: action
      impl: orders/fetch-order-grid-data
    - type: action
      impl: products/fetch-product-grid-data
    - type: action
      impl: customers/fetch-customer-grid-data
```

### Changeset bump

This is a `minor` bump. All affected types are marked `@experimental`, so breaking changes to them
do not constitute a semver-major change under the SDK's stability policy.

## Drawbacks

- Apps that genuinely need API Mesh federation must wire it inside the handler themselves. The SDK
  no longer manages the Mesh reference in v2. This is intentional — Mesh is now a handler
  implementation detail, not a config-level concern.
- Keeping v1 functional alongside v2 means the SDK ships two schemas for the same concept during
  the deprecation window. This is intentional — removing v1 immediately would be a breaking change
  for existing apps.

## Rationale and alternatives

**Keep v1 alongside v2 during a deprecation window (adopted).**
Removing v1 immediately would be a breaking change for apps that depend on
`adminUiSdk.registration.order.gridColumns`. The deprecation window lets existing apps migrate at
their own pace while new apps adopt v2 from the start. v1 will be removed in a future major or
minor release once the migration path is established and adoption of v2 is confirmed.

**Remove v1 immediately.**
Considered and rejected for this release. All grid column types under `adminUiSdk` are marked
`@experimental`, so a removal is not semver-major under the SDK's stability policy — but forcing
an immediate migration adds friction with no compensating benefit at this stage. Deferral costs
nothing and preserves optionality.

**Make `meshId` optional in v1.**
Rejected. This does not solve the multi-environment problem (the ID is still environment-specific),
and the wire contract remains undocumented. It would also introduce a conditional path where the
SDK sometimes validates Mesh presence and sometimes does not, increasing complexity with no net gain.

**Per-grid schemas instead of a unified one.**
Rejected per "one concept, one place." The three grids have identical structure. `gridType` in the
wire request lets a single handler serve multiple grids if the developer chooses; the SDK need not
enforce separation.

**Impact of not doing this.**
Grid columns remain coupled to API Mesh, blocking apps that don't need federation, and the wire
contract remains undocumented. The multi-environment `meshId` problem has no SDK-level solution.

## Future possibilities

- Removal of `adminUiSdk` grid columns and `commerce/backend-ui/1` once migration is complete.
- Additional grid targets (invoice, shipment grids) following the same unified schema pattern.
- Porting remaining `adminUiSdk` extension points (mass actions, menus, view buttons, custom fees)
  to `commerce/backend-ui/2` under `adminUi`.
- Handler scaffolding: `aio commerce generate handler --type grid-columns` to generate a typed
  handler stub that implements the wire contract.
