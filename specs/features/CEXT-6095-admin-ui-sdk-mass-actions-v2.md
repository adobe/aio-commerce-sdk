# Admin UI SDK mass actions v2

- **Ticket:** [CEXT-6095](https://jira.corp.adobe.com/browse/CEXT-6095)
- **Created:** 2026-05-29
- [x] **Implemented**

## Summary

Add `commerce/backend-ui/2` support alongside the existing `commerce/backend-ui/1`, introducing a
new `adminUi` config section with a cleaner mass-action shape that uses an explicit `type`
discriminator, an inlined `notifications` block, and a `runtimeAction` reference to a
`workerProcess` operation. The mass-action payload flows through the existing
`app-management/app-config.js` (which already serves the app config); no dedicated `registration`
action is generated for v2. The Admin UI SDK extension at `commerce/backend-ui/2` reads the
`adminUi` block from `app-config.js` directly.

**`commerce/backend-ui/1` is kept in place.** A dedicated ticket will remove it once the
migration is complete. Both extension points coexist: `backend-ui/1` continues to generate the
registration action for apps that still use `adminUiSdk`; `backend-ui/2` generates the new
`ext.config.yaml` with `workerProcess` entries for apps that adopt `adminUi`.

## Motivation

The mass-action shape that app developers write today mixes UI flows and backend flows behind a
single boolean (`displayIframe`). The same `path` field means two different things depending on
that boolean, runtime-action invocations are wired through a relative-path "hack", and the
success/error messages for an action live in a separate top-level block
(`bannerNotification.massActions`) cross-referenced by `actionId`. The result is a config that
is hard to read, hard to author correctly, and easy to break by renaming an `actionId` in one
place but not the other.

**Goals**

- Generate `commerce-backend-ui-2/ext.config.yaml` with operations (`view` for the SPA,
  `workerProcess` for the developer's worker handlers) and the matching runtime-action
  declarations — but no `registration` action. `commerce/backend-ui/1` continues to be generated
  unchanged for apps still using `adminUiSdk`.
- Replace the mass-action input schema with the v2 shape:
  - `id` (renamed from `actionId`); developers write the bare name and the SDK
    auto-prefixes with `${metadata.id}::` to produce the final `actionId` in the generated
    JSON.
  - `type: "view" | "worker"` discriminator (replaces the `displayIframe` boolean). Naming
    mirrors App Builder's `view` and `workerProcess` operation type names.
  - `runtimeAction: "<impl>"` for `type: "worker"`, referencing a `workerProcess`
    operation declared in `app.config.yaml`. The value matches the operation's `impl`
    verbatim (e.g. `runtimeAction: "customers/export-customers"` matches
    `impl: customers/export-customers`) — unique by App Builder construction, so no
    disambiguation is needed. Naming aligns with the `runtimeAction` field already used in
    webhooks and events (see #480).
  - Inlined `notifications: { success?, error? }`, replacing the standalone
    `bannerNotification.massActions.<grid>[]` cross-reference.
  - Field applicability enforced by the schema (e.g. `sandbox` only valid for `type: "view"`,
    `timeout` only valid for `type: "worker"`).
- Add v2 fixtures and tests alongside the existing v1 ones — do not remove or modify v1 fixtures
  or tests.
- Cross-file validation at `pre-app-build` time that `runtimeAction` matches the `impl` of a
  `workerProcess` operation declared in `app.config.yaml`. A typo should fail the build, not
  produce a runtime 404 from Adobe Commerce.

**Non-goals**

- Migrating the other v1 chapters (menu items, grid columns, view buttons, custom fees, banner
  notifications for view buttons) to v2. They are still authored in their v1 shape; only mass
  actions move.
- Removing the standalone `bannerNotification.orderViewButtons` block — that belongs to a
  different chapter and is preserved unchanged.
- Removing `commerce/backend-ui/1` support from Adobe Commerce admin. That is a separate
  decision owned by the Admin UI SDK team; this spec only covers SDK-side generation.

## Developer experience

### Authoring a mass action

Before this feature, both UI and worker mass actions share one shape, with `displayIframe`
flipping the behavior:

```ts
// v1 — current shape
adminUiSdk: {
  registration: {
    customer: {
      massActions: [
        // UI iframe
        {
          actionId: "my-app::tag-customers",
          label: "Tag selected customers",
          path: "#/tag-customers",
          displayIframe: true,
          sandbox: "allow-modals",
          customerSelectLimit: 100,
        },
        // Backend (iframe-less)
        {
          actionId: "my-app::export-customers",
          label: "Export selected customers",
          path: "customers/export-customers", // relative path "hack"
          displayIframe: false,
          timeout: 30,
          customerSelectLimit: 1000,
        },
      ],
    },
    bannerNotification: {
      massActions: {
        customer: [
          {
            actionId: "my-app::export-customers",
            successMessage: "Customers exported successfully",
            errorMessage: "Could not export customers",
          },
        ],
      },
    },
  },
}
```

With this feature, the same two actions are authored with an explicit `type`, inlined
notifications, and a `runtimeAction` reference instead of a hand-rolled path for the worker case:

```ts
// v2 — new shape
adminUi: {
  customer: {
    massActions: [
      {
        id: "tag-customers", // SDK prepends `${metadata.id}::` automatically
        label: "Tag selected customers",
        description: "Adds a bulk action to tag selected customers from the grid.",
        type: "view",
        path: "#/tag-customers",
        sandbox: "allow-modals",
        selectionLimit: 100,
        notifications: {
          success: "Customers tagged successfully",
          error: "Could not tag the selected customers",
        },
      },
      {
        id: "export-customers",
        label: "Export selected customers",
        description: "Adds a bulk action to export selected customers as CSV.",
        type: "worker",
        runtimeAction: "customers/export-customers", // matches the workerProcess `impl` verbatim
        timeout: 30,
        selectionLimit: 1000,
        notifications: {
          success: "Customers exported successfully",
          error: "Could not export customers",
        },
      },
    ],
  },
}
```

> **Renames from v1:** the top-level block is `adminUi` (renamed from `adminUiSdk`, aligning
> with #480), and the `registration` wrapper present in v1 is dropped — entities live directly
> under `adminUi`.

Operations referenced from `runtimeAction` must be declared on `commerce/backend-ui/2` in
`app.config.yaml`:

```yaml
extensions:
  commerce/backend-ui/2:
    operations:
      view:
        - type: web
          impl: index.html
      workerProcess:
        - type: action
          impl: customers/export-customers
```

### Field applicability

The schema enforces which fields apply to which `type`:

| Field            | `type: "view"` | `type: "worker"` |
| ---------------- | -------------- | ---------------- |
| `id`             | required       | required         |
| `label`          | required       | required         |
| `title`          | optional       | optional         |
| `confirm`        | optional       | optional         |
| `description`    | optional       | optional         |
| `notifications`  | optional       | optional         |
| `selectionLimit` | optional       | optional         |
| `path`           | required       | rejected         |
| `sandbox`        | optional       | rejected         |
| `runtimeAction`  | rejected       | required         |
| `timeout`        | rejected       | optional         |

Misuse produces a clear validation error at build time, e.g.:

```
Field "runtimeAction" is not allowed when type is "view"
Field "path" is required when type is "view"
```

### `selectionLimit` rename

The order, product, and customer grids each used a differently named limit field today
(`selectionLimit`, `productSelectLimit`, `customerSelectLimit`). In v2 they unify to
`selectionLimit` across all three grids — same field name in input and generated JSON.

### Wire contract

#### `type: "view"` — iframe

Commerce opens the `path` URL in a modal iframe overlay. The selected entity IDs are appended to
the URL as a JSON-encoded query parameter:

```
{path}?selection={"ids":["000000001","000000002"],"gridType":"customer"}
```

- `ids` — array of selected entity IDs (strings).
- `gridType` — `"order" | "product" | "customer"`, matching the extension point that declared the
  action.

The iframe (the App Builder SPA at `web-src`) is responsible for reading these parameters,
executing the bulk operation, and closing the modal when done.

> **Open question:** Exact query-parameter name and serialization format to be confirmed against
> the Admin UI SDK v2 implementation. The shape above is the expected v2 format; v1 passed IDs
> differently. Update this section once confirmed.

#### `type: "worker"` — runtime action

Commerce invokes the runtime action declared in `runtimeAction` with the following request body:

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "gridType": "customer",
  "ids": ["000000001", "000000002", "000000003"]
}
```

- `ids` — array of selected entity IDs.
- `gridType` — `"order" | "product" | "customer"`, matching the extension point.
- `requestId` — unique identifier for this invocation; use it for idempotency.
- Commerce chunks to a maximum of 1000 IDs per request. Handlers do not need to implement chunking.

**Success response:**

```json
{
  "status": "success",
  "message": "3 customers exported."
}
```

**Failure response:**

```json
{
  "status": "error",
  "message": "Could not reach export service."
}
```

- A non-2xx HTTP response or a body without `"status": "success"` is treated as a failure.
- `message` is surfaced to the user via the `notifications.error` string defined in the config, if
  present; the response `message` is used only for logging.

### What does not change

- The other Admin UI SDK extension blocks (menu items, grid columns, view buttons, custom
  fees, banner notifications for view buttons) continue to use their v1 shape. Only mass
  actions move to v2 in this ticket.

## Design

The v2 `adminUi` block flows through the existing `app-management/app-config.js`, which
already serves the full app config — the Admin UI SDK extension at `commerce/backend-ui/2`
reads `adminUi` from that response. No dedicated `registration` action is generated.

`src/commerce-backend-ui-2/ext.config.yaml` contains only the operations (`view` for the SPA,
`workerProcess` for the developer's worker handlers) and the matching runtime-action
declarations.

The only SDK-side transform on the `adminUi` payload is prefixing `id` with `${metadata.id}::`
to produce the final `actionId`. Every other field is serialized verbatim.

### Tests

- `test/unit/config/schema/admin-ui-sdk.test.ts` — v1 tests kept unchanged. New `AdminUiSchema`
  (v2) tests added in a separate describe block: variant behavior (each `type` accepts its own
  fields and rejects the other's), unified `selectionLimit`, flat `description`, rejection of the
  old `installation` nesting.
- `test/fixtures/config.ts` — existing v1 fixtures (`configWithAdminUiSdk`,
  `configWithFullAdminUiSdk`) kept unchanged. New v2 fixtures added alongside:
  `configWithAdminUiV2` and `configWithFullAdminUiV2`, using the v2 input shape with flat
  `description`.
- `test/unit/commands/generate/actions/config.test.ts` — v1 tests kept. New describe block added
  for `buildAdminUiV2ExtConfig` asserting `backend-ui/2` hook string and `workerProcess` entries.
- `test/integration/commands/hooks/pre-app-build.test.ts` — v1 `"backend-ui/1"` tests kept.
  New tests added for `"backend-ui/2"`: assertions that (a) `updateExtConfig` is called when
  `adminUi` is present, (b) the hook succeeds silently when `adminUi` is absent.

### Documentation

`packages/aio-commerce-lib-app/docs/usage.md` is updated to reflect the v2 shape for mass
actions, the new folder name, and the new `commerce/backend-ui/2` extension point ID. The
field reference for mass actions is rewritten around the variant; the
`bannerNotification.massActions` reference is removed; `bannerNotification.orderViewButtons`
stays.

### Changeset

A `minor` changeset. This is additive for the SDK API surface — existing v1 apps don't break
because they're pinned to the v1 SDK release line. New apps initialized after this change get
v2 by default.

## Drawbacks

- Within a single `adminUi` block, mass actions use the v2 shape while other chapters (menu
  items, grid columns, view buttons, custom fees) still use the v1 shape. Inconsistent until
  subsequent tickets migrate them.

## Future possibilities

- Migrate the remaining Admin UI SDK chapters to v2 and retire the v1 schema from the SDK.
- Support async backend mass actions (flagged as an open thread in the wiki spec).
