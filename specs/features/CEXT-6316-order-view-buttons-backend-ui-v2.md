# Order view buttons on backend-ui/2

- **Ticket:** [CEXT-6316](https://jira.corp.adobe.com/browse/CEXT-6316)
- **Created:** 2026-06-03
- [ ] **Implemented**

## Summary

Adds `order.viewButtons` support to the v2 Admin UI schema under `adminUi`, on
`commerce/backend-ui/2`. The shape carries over the v1
`adminUiSdk.registration.order.viewButtons` fields (`buttonId`, `label`, `level`, `sortOrder`,
`confirm`, `timeout`, `sandbox`) and adopts the same v2 conventions established for grid columns
in [CEXT-6096](./CEXT-6096-admin-ui-grid-column-extensions.md) and mass actions in
[CEXT-6095](./CEXT-6095-admin-ui-sdk-mass-actions-v2.md): no `registration` wrapper, no generated
registration action, and an explicit `type: "view" | "worker"` discriminator (replacing the v1
`displayIframe` boolean) that mirrors App Builder's `view` and `workerProcess` operation type
names. `type: "view"` keeps `path` as the in-app iframe URL; `type: "worker"` introduces
`runtimeAction` — a `workerProcess` operation name resolved by App Registry at runtime — in place
of the v1 developer-defined HTTP path. The v1 viewButtons schema is deprecated alongside the rest
of `adminUiSdk` and remains functional during the deprecation window.

## Motivation

`order.viewButtons` is part of the `commerce/backend-ui/2` parity work. Until view buttons land on
v2, any app that adopts `adminUi` must keep `adminUiSdk` configured in parallel solely to declare
them, defeating the migration. The v1 design also carries two concrete problems we have an
opportunity to fix in v2:

1. **The non-iframe handler is an opaque HTTP path.** v1 view buttons set `displayIframe: false`
   and `path: "/api/v1/web/.../delete-order"` — a string the SDK does not validate, that bypasses
   App Registry resolution, and that ties the registration to a deployment-specific URL shape. The
   wire contract (request payload, response payload, error format) is documented in the Commerce
   developer site but not specified by the SDK.
2. **`displayIframe` overloads two unrelated decisions onto one boolean.** Whether the button
   renders inline UI or calls a backend handler is a structural choice that determines which other
   fields are valid (`path` vs handler reference, `sandbox` vs `timeout`). Encoding that choice as
   a boolean toggle on an otherwise-shared shape forces the validator to second-guess every field
   and produces confusing error messages. CEXT-6095 hit the same problem on mass actions and
   resolved it with an explicit `type` discriminator; view buttons should follow suit.

**Goals**

- Add `order.viewButtons` under `adminUi.order` for `commerce/backend-ui/2`.
- Replace `displayIframe` with a `type: "view" | "worker"` discriminator, matching the convention
  adopted for mass actions in CEXT-6095 and aligning with App Builder's `view` / `workerProcess`
  operation type names.
- Use `runtimeAction` (a `workerProcess` operation name) as the handler reference for
  `type: "worker"`. Keep `path` for `type: "view"` — the iframe target is still an in-app URL.
- Formally specify the request/response wire contract for `type: "worker"`.
- Generate `workerProcess` declarations in `ext.config.yaml` for every `runtimeAction` referenced
  by a view button, the same way grid columns do.
- Ensure a `view` operation pointing at the app's web entry is declared in `ext.config.yaml`
  whenever the registration contains at least one `type: "view"` button, so Commerce can resolve
  the iframe target.
- Deprecate `adminUiSdk.registration.order.viewButtons`; keep it functional until removal.

**Non-goals**

- Adding view button support to `product` or `customer` grids. The v1 SDK only exposes view
  buttons on the order grid and Commerce does not surface them elsewhere — out of scope for this
  ticket.
- Banner notifications for view button outcomes (`bannerNotification.orderViewButtons` in v1).
  Tracked separately and not required for parity at the config level.
- Removing v1 view buttons in this release — deferred to the same future release that removes the
  rest of `adminUiSdk`.
- Detecting `buttonId` collisions across installed apps. Handled by Commerce per CEXT-6322.

## Developer experience

### Defining order view buttons

```ts
// app.commerce.config.ts
export default defineConfig({
  adminUi: {
    order: {
      viewButtons: [
        {
          buttonId: "delete-order",
          label: "Delete",
          description: "Permanently removes the order and its associated records.",
          type: "view",
          path: "#/delete-order",
          level: 0,
          sortOrder: 80,
          confirm: {
            message: "Are you sure you want to delete this order?",
          },
        },
        {
          buttonId: "sync-inventory",
          label: "Sync inventory",
          description: "Pushes the latest stock counts for this order's items to the ERP.",
          type: "worker",
          runtimeAction: "orders/sync-inventory",
          timeout: 15,
          level: 1,
          sortOrder: 10,
        },
      ],
    },
  },
});
```

`viewButtons` lives under `adminUi.order`, mirroring the v1 location under
`adminUiSdk.registration.order`. The block accepts an array of view button entries discriminated
by an explicit `type` field, with two variants:

- `type: "view"` — Commerce loads the in-app URL given by `path` inside an iframe in the admin.
  Equivalent to the v1 `displayIframe: true` (the v1 default).
- `type: "worker"` — Commerce invokes the `workerProcess` operation named by `runtimeAction`,
  resolved by App Registry at runtime. Equivalent to the v1 `displayIframe: false`, but the
  developer-defined HTTP `path` is replaced by an operation reference the SDK validates and wires
  end-to-end. The `view` / `worker` naming mirrors App Builder's operation type names and matches
  the convention adopted for mass actions in CEXT-6095.

The SDK derives the `workerProcess` entries in `ext.config.yaml` from every `runtimeAction`
referenced under `viewButtons`, deduplicating by operation name. Developers do not declare them
by hand.

### Field applicability

The schema enforces which fields apply to which `type`:

| Field           | `type: "view"` | `type: "worker"` |
| --------------- | -------------- | ---------------- |
| `buttonId`      | required       | required         |
| `label`         | required       | required         |
| `description`   | optional       | optional         |
| `level`         | optional       | optional         |
| `sortOrder`     | optional       | optional         |
| `confirm`       | optional       | optional         |
| `path`          | required       | rejected         |
| `sandbox`       | optional       | rejected         |
| `runtimeAction` | rejected       | required         |
| `timeout`       | rejected       | optional         |

`label` is the on-button text Commerce renders in the admin. `description` is a free-form sentence
that is not rendered on the button itself; it is exposed via `app-config` so installation tooling
(the app-management plugin's install flow, the admin's permission/consent screens) can present a
human-readable summary of what each button does alongside its `label`.

Misuse produces a clear validation error at build time, e.g.:

```
Field "runtimeAction" is not allowed when type is "view"
Field "path" is required when type is "view"
```

### Wire contract (`type: "worker"`)

**Request** (sent by Commerce to the handler resolved from `runtimeAction`):

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "buttonId": "sync-inventory",
  "orderId": "000000001"
}
```

- `orderId` is a single ID. View buttons act on the order currently being viewed; chunking does
  not apply.
- `buttonId` lets a single handler serve multiple buttons by branching on it.

**Success response:**

```json
{}
```

- An empty object signals success. Commerce displays no banner unless the registration declares
  one (out of scope for this ticket).

**Failure response:**

```json
{
  "errorStatus": "INTERNAL_ERROR",
  "errorMessage": "Could not reach inventory service"
}
```

- Mirrors the failure shape used by grid columns (CEXT-6096) and the documented Commerce contract
  for view buttons without iframes.
- Per the v1 Commerce contract, Commerce additionally exposes failure details on
  `GET /V1/adminuisdk/orderviewbutton/<requestId>` — unchanged in v2.

### buttonId uniqueness

`buttonId` is a plain identifier declared by the developer. The SDK serves it as-is; collision
handling across installed apps is Commerce's responsibility (CEXT-6322). Unlike the v1 sample
code, the SDK does not prescribe the `<extensionId>::<buttonName>` format — adopting or not
adopting the convention is left to the developer.

### Migration from v1

| v1                                          | v2                          | Notes                                                                   |
| ------------------------------------------- | --------------------------- | ----------------------------------------------------------------------- |
| `adminUiSdk.registration.order.viewButtons` | `adminUi.order.viewButtons` | No `registration` wrapper in v2                                         |
| `displayIframe: true` (or omitted)          | `type: "view"`              | Explicit discriminator; `view` aligns with App Builder operation naming |
| `displayIframe: false`                      | `type: "worker"`            | Explicit discriminator; `worker` aligns with `workerProcess` operations |
| `path` (under `displayIframe: false`)       | `runtimeAction`             | Operation name resolved by App Registry, not a URL                      |
| `path` (under `displayIframe: true`)        | `path`                      | Unchanged — still the in-app iframe URL                                 |
| `buttonId`, `label`, `level`, `sortOrder`   | _(same)_                    | Unchanged from v1                                                       |
| `confirm.message`, `timeout`                | _(same)_                    | Unchanged from v1; `timeout` only valid on `type: "worker"`             |
| `sandbox`                                   | `sandbox`                   | Unchanged — only valid on `type: "view"`                                |
| _(none)_                                    | `description`               | New optional field; surfaced to install tooling alongside `label`       |
| Extension point: `commerce/backend-ui/1`    | `commerce/backend-ui/2`     | Required change in `app.config.yaml` and `install.yaml`                 |

Both keys can coexist during transition. Once all order view buttons have moved to `adminUi`, the
`adminUiSdk.registration.order.viewButtons` block can be removed.

## Design

### Schema extension

The v2 schema introduced in CEXT-6096 lives in
`packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts`. This change extends the existing
`AdminUiSchema` `order` block with an optional `viewButtons` array. No new files are introduced.

```ts
const OrderViewButtonSchema = v.variant("type", [
  v.object({
    type: v.literal("view"),
    buttonId: nonEmptyStringValueSchema("view button ID"),
    label: nonEmptyStringValueSchema("view button label"),
    description: v.optional(nonEmptyStringValueSchema("view button description")),
    path: nonEmptyStringValueSchema("view button path"),
    level: v.optional(ViewButtonLevelSchema),
    sortOrder: v.optional(positiveNumberValueSchema("sortOrder")),
    confirm: v.optional(ViewButtonConfirmSchema),
    sandbox: v.optional(SandboxSchema),
  }),
  v.object({
    type: v.literal("worker"),
    buttonId: nonEmptyStringValueSchema("view button ID"),
    label: nonEmptyStringValueSchema("view button label"),
    description: v.optional(nonEmptyStringValueSchema("view button description")),
    runtimeAction: nonEmptyStringValueSchema("runtime action"),
    level: v.optional(ViewButtonLevelSchema),
    sortOrder: v.optional(positiveNumberValueSchema("sortOrder")),
    confirm: v.optional(ViewButtonConfirmSchema),
    timeout: v.optional(positiveNumberValueSchema("timeout")),
  }),
]);
```

The `ViewButtonLevelSchema`, `ViewButtonConfirmSchema`, and `SandboxSchema` helpers already exist
in `admin-ui-sdk.ts` and are reused. The v1 `withSandboxDisplayIframeCheck` wrapper is _not_
reused — v2 enforces the sandbox/path/runtimeAction split structurally via the variant, so the
post-parse guard is no longer needed. If lifting the reused helpers into a shared module is
preferable, that is an implementation detail — the public shape is what this spec pins down.

The v2 `AdminUiSchema` updates accordingly:

```ts
order: v.optional(
  v.object({
    gridColumns: v.optional(GridColumnsSchema),
    viewButtons: v.optional(v.array(OrderViewButtonSchema)),
  }),
),
```

The v1 `OrderViewButtonSchema` in `admin-ui-sdk.ts` is unchanged. The exported v1 type
`OrderViewButton` is marked `@deprecated` as part of the broader `adminUiSdk` deprecation.

### Pre-app-build hook

The `commerce/backend-ui/2` path already collects `runtimeAction` values from grid columns and
emits `workerProcess` entries (CEXT-6096). This change extends the pre-app-build hook in two ways:

1. **`workerProcess` for `type: "worker"` buttons.** The collection step also walks
   `adminUi.order.viewButtons`, picking up `runtimeAction` from every entry with `type: "worker"`,
   deduplicating by operation name. A single `runtimeAction` value referenced by both a grid
   column and a view button produces one `workerProcess` entry.
2. **`view` for `type: "view"` buttons.** When the registration contains at least one
   `type: "view"` button, the hook ensures the `commerce/backend-ui/2` extension declares a `view`
   operation pointing at the app's web entry (`index.html` by default). If the developer has not
   declared one, the SDK adds it; if one is already declared, it is left untouched. The operation
   is shared across every `type: "view"` button on the registration — Commerce resolves each
   button's `path` as a fragment relative to that single web entry.

No registration action is generated. Commerce reads `adminUi.order.viewButtons` directly from the
`app-config` endpoint on `commerce/extensibility/1`, the same way it reads grid columns.

Example generated `ext.config.yaml` excerpt for the developer experience example above:

```yaml
hooks:
  pre-app-build: "EXTENSION=backend-ui/2 $packageExec aio-commerce-lib-app hooks pre-app-build"
operations:
  view:
    - type: web
      impl: index.html
  workerProcess:
    - type: action
      impl: orders/sync-inventory
```

### Validation rules

- `type: "view"` requires `path`; `runtimeAction` and `timeout` are rejected.
- `type: "worker"` requires `runtimeAction`; `path` and `sandbox` are rejected.
- `sandbox` is only valid on `type: "view"` — structurally enforced by the variant, not by a
  post-parse check.

### Changeset bump

`minor`. All v2 admin-ui types are `@experimental`, so additive changes do not constitute a
breaking change under the SDK's stability policy.

## Drawbacks

- Splitting the v2 view button schema into two variants by `type` is stricter than the v1
  single-shape schema and produces noisier validation errors for developers who switch a button
  between `"view"` and `"worker"` after the fact. The trade-off is that an invalid combination —
  `type: "worker"` with a developer-defined `path`, or `type: "view"` with a `runtimeAction` —
  is caught at config validation time instead of failing at runtime.
- The v2 wire contract is incompatible with v1 handlers. A developer migrating an existing button
  to `runtimeAction` must update the handler signature. This is the same kind of break the
  gridColumns v2 migration introduces (request payload shape change) and is intentional.

## Rationale and alternatives

**Reuse the v1 shape verbatim (single `path` field, no `runtimeAction`).**
Rejected. It would force the v2 schema to inherit v1's documented but unspecified wire contract
and leave non-iframe handlers as opaque HTTP endpoints. The same reasoning that drove
`runtimeAction` for grid columns applies here.

**Keep `displayIframe` as the discriminator in v2.**
Rejected. `displayIframe` is a presentation-layer boolean masquerading as a structural switch — it
implies the only difference is whether an iframe renders, when in fact the two variants take
different handler references and have non-overlapping field sets. `type: "view" | "worker"` names
the structural choice directly and matches App Builder's operation type names (`view`,
`workerProcess`). CEXT-6095 adopted the same discriminator for mass actions; aligning view buttons
keeps the v2 surface consistent.

**Keep `runtimeAction` and `path` as two optional fields on a single object instead of a discriminated variant.**
Rejected. The variant form makes the mutual exclusion explicit at the type level — TypeScript
consumers get accurate autocomplete based on the chosen `type` value, and the validation error for
an invalid combination is concrete instead of a generic "either A or B is required".

**Defer the wire contract to a separate ticket.**
Rejected. Shipping `runtimeAction` without specifying the request/response shape repeats the
documented-but-unspecified situation v2 is meant to fix. Pinning the contract in the same spec
costs little and forecloses ambiguity for the implementation PR.

**Add view buttons to `product` and `customer` while we are at it.**
Rejected. Commerce does not currently support view buttons on those grids; speculative SDK
support would expose a config shape that has no effect. If Commerce adds them later, the SDK can
follow with the same schema.

**Impact of not doing this.**
The v2 migration remains half-finished: an app touching the order grid keeps both `adminUiSdk` and
`adminUi` blocks indefinitely, and the non-iframe handler path stays an unspecified HTTP target.
The deprecation window for `adminUiSdk` cannot close until parity is reached.

## Unresolved questions

None.

## Future possibilities

- `bannerNotification.orderViewButtons` parity in `adminUi`, once the v2 banner notification
  schema is defined.
- Removal of `adminUiSdk.registration.order.viewButtons` alongside the rest of `adminUiSdk` and
  `commerce/backend-ui/1` (CEXT-6313).
- Handler scaffolding: `aio commerce generate handler --type view-button` to produce a typed
  handler stub matching the wire contract.
