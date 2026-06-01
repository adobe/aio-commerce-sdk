# Admin UI grid column extensions (v2)

- **Ticket:** [CEXT-6096](https://jira.corp.adobe.com/browse/CEXT-6096)
- **Created:** 2026-05-29
- [ ] **Implemented**

> **Breaking change.** The v1 grid column schema (`commerce/backend-ui/1`, `data.meshId`,
> `properties`, `columnId`) is removed, and the top-level config key is renamed from `adminUiSdk`
> to `adminUi`. Existing apps must migrate to v2. See [Migration from v1](#migration-from-v1) below.

## Summary

The SDK replaces the v1 Admin UI grid column schema with a unified v2 schema covering order,
product, and customer grids. Support for `commerce/backend-ui/1` and the mesh-based config
(`data.meshId`, `properties`, `columnId`, `float` type) is removed. Apps must declare
`commerce/backend-ui/2` and adopt the new shape: `runtimeAction` (a `workerProcess` operation name
resolved by App Registry at runtime), `columns` (renamed from `properties`), and `key` (renamed
from `columnId`). The wire contract between Commerce and the handler is formally standardized for
the first time.

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

- Replace `data.meshId` with `runtimeAction` (a `workerProcess` operation name) in all three grids.
- Rename `properties` → `columns`, `columnId` → `key` for clarity.
- Add `label` and `description` to each `gridColumns` block for display during installation.
- Formally specify the request/response wire contract.
- Remove `commerce/backend-ui/1` and all v1 schema artifacts from the SDK.
- Rename the top-level config key from `adminUiSdk` to `adminUi`.
- Use a single unified column schema under `order.gridColumns`, `product.gridColumns`, and
  `customer.gridColumns`.

**Non-goals**

- Supporting v1 in any compatibility mode or deprecation window.
- Adding grid targets beyond order, product, and customer.
- Implementing mass action v2 (separate ticket).
- Wrapping or managing the Commerce API Mesh service.
- Creating app-management or app-migration plugin skills for scaffolding or migrating grid column extensions — handled in a separate scope.

## Developer experience

### Defining grid columns

The config shape is the same across all three grids:

```ts
// app-config.ts
export default defineConfig({
  adminUi: {
    registration: {
      order: {
        gridColumns: {
          label: "Order fulfillment data",
          description:
            "Adds fulfillment status and risk score to the order grid",
          runtimeAction: "orders/fetch-order-grid-data",
          columns: [
            {
              key: "fulfillment_status",
              label: "Fulfillment",
              type: "string",
              align: "left",
            },
            {
              key: "risk_score",
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
              key: "inventory_status",
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
              key: "loyalty_tier",
              label: "Loyalty Tier",
              type: "string",
              align: "left",
            },
          ],
        },
      },
    },
  },
});
```

The SDK generates the `workerProcess` operation declarations in `ext.config.yaml` automatically
from the `runtimeAction` values — developers do not write them by hand. The only thing the
developer needs to provide alongside the config is the handler implementation itself (e.g.
`orders/fetch-order-grid-data.js`). App Registry resolves the operation name to the deployed
runtime action URL when Commerce fetches the extension.

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

### Column types

| `type` value | Description                          |
| ------------ | ------------------------------------ |
| `boolean`    | Boolean value                        |
| `date`       | Date (no time component)             |
| `datetime`   | Date and time                        |
| `decimal`    | Decimal number (replaces v1 `float`) |
| `integer`    | Integer                              |
| `string`     | Text                                 |

### Migration from v1

| v1                                       | v2                           | Notes                                                         |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| `adminUiSdk`                             | `adminUi`                    | Top-level config key rename in `defineConfig()`               |
| `data.meshId`                            | `runtimeAction`              | Operation name declared in `app.config.yaml`, not a Mesh hash |
| `properties`                             | `columns`                    | Array of column declarations                                  |
| `properties[].columnId`                  | `columns[].key`              | Doubles as the response data key — make them match            |
| `properties[].type: "float"`             | `columns[].type: "decimal"`  | Renamed                                                       |
| _(absent)_                               | `columns[].type: "datetime"` | New type in v2                                                |
| _(absent)_                               | `label`, `description`       | New block-level metadata for App Management installation UI   |
| Extension point: `commerce/backend-ui/1` | `commerce/backend-ui/2`      | Required change in `app.config.yaml`                          |

## Design

### Config key rename

The top-level config key changes from `adminUiSdk` to `adminUi`. This is a rename across the SDK:

- The config property in `defineConfig()` — `adminUiSdk` → `adminUi`
- `AdminUiSdkSchema` → `AdminUiSchema`
- `AdminUiSdkConfiguration` → `AdminUiConfiguration`
- `AdminUiSdkRegistration` → `AdminUiRegistration`
- `hasAdminUiSdk()` → `hasAdminUi()`
- All related exported types and guards in `packages/aio-commerce-lib-app`

### Schema changes

`packages/aio-commerce-lib-app/source/config/schema/admin-ui-sdk.ts`

Remove `GridColumnPropertySchema` (v1) and `GridColumnsSchema` (v1). Add:

```ts
const GridColumnSchema = v.object({
  key: nonEmptyStringValueSchema("column key"),
  label: nonEmptyStringValueSchema("column label"),
  type: v.picklist([
    "boolean",
    "date",
    "datetime",
    "decimal",
    "integer",
    "string",
  ]),
  align: ColumnAlignSchema, // 'left' | 'center' | 'right' — unchanged
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
```

`OrderExtensionPointsSchema`, `ProductExtensionPointsSchema`, and
`CustomerExtensionPointsSchema` continue to reference `GridColumnsSchema` by name — the reference
is unchanged, the schema it points to is replaced.

The exported `GridColumns` type is updated automatically via `v.InferInput<typeof GridColumnsSchema>`.

### Extension point constant

`packages/aio-commerce-lib-app/source/commands/constants.ts`

```ts
// before
export const BACKEND_UI_EXTENSION_POINT_ID = "commerce/backend-ui/1";

// after
export const BACKEND_UI_EXTENSION_POINT_ID = "commerce/backend-ui/2";
```

The constant name is preserved so callsites do not change. Only the value changes.

### Pre-app-build hook

`packages/aio-commerce-lib-app/source/commands/hooks/pre-app-build.ts`

Remove `"backend-ui/1"` from the `Extension` union and replace with `"backend-ui/2"`. When
`hasAdminUi` is true, the hook now performs two generation steps:

1. **Registration action** — unchanged from v1: generates the JS file that returns the
   registration config when Commerce calls the extension.

2. **`ext.config.yaml` workerProcess declarations** — new in v2: collects all unique
   `runtimeAction` values across `order`, `product`, and `customer` grid column configs,
   then writes them as `workerProcess` entries in `ext.config.yaml` for
   `commerce/backend-ui/2`. Developers do not declare these manually; the SDK derives them
   from `app.commerce.config.ts` and keeps `ext.config.yaml` in sync on every build.

Example generated `ext.config.yaml` fragment for the config above:

```yaml
operations:
  view:
    - type: web
      impl: index.html
  workerProcess:
    - type: action
      impl: orders/fetch-order-grid-data
    - type: action
      impl: products/fetch-product-grid-data
    - type: action
      impl: customers/fetch-customer-grid-data
```

### Registration action generation

No template change is needed. The registration action inlines the config as a JS object literal;
`runtimeAction` is serialized as-is. Commerce reads `runtimeAction` directly from the registration
JSON — no field mapping is required on either side.

### Changeset bump

This is a `minor` bump. All affected types are marked `@experimental`, so breaking changes to them
do not constitute a semver-major change under the SDK's stability policy.

## Drawbacks

- Apps that genuinely need API Mesh federation must wire it inside the handler themselves. The SDK
  no longer manages the Mesh reference. This is intentional — Mesh is now a handler implementation
  detail, not a config-level concern.
- `key` doing double duty (response data key and column identifier) is explicit by design, but
  developers used to v1's separate `columnId` field may find it surprising at first.
- Dropping v1 requires migration for any existing app using grid columns. There is no deprecation
  window.

## Rationale and alternatives

**Keep v1 alongside v2.**
Rejected. A compatibility shim would preserve exactly the problem being solved: the undocumented
Mesh coupling and the opaque `meshId`. There is no scenario in which both schemas would be
simultaneously correct.

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

## Unresolved questions

**Single-operation constraint.**
Can the same `runtimeAction` value appear in `order.gridColumns` and `customer.gridColumns`? The
SDK imposes no uniqueness constraint — the same operation name can appear in multiple grid column
blocks. A single handler would then receive requests for both grid types and branch on `gridType`.
Confirm this is correct and no constraint should be added.

## Future possibilities

- Additional grid targets (invoice, shipment grids) following the same unified schema pattern.
- Handler scaffolding: `aio commerce generate handler --type grid-columns` to generate a typed
  handler stub that implements the wire contract.
