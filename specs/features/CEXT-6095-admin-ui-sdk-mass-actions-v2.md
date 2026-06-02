# Admin UI SDK mass actions v2

- **Ticket:** [CEXT-6095](https://jira.corp.adobe.com/browse/CEXT-6095)
- **Created:** 2026-05-29
- [ ] **Implemented**

## Summary

Move the Admin UI SDK code generation from extension point `commerce/backend-ui/1` to the new
`commerce/backend-ui/2`, and replace the mass-action input schema in `app.commerce.config.*` with
a cleaner shape that uses an explicit `type` discriminator, an inlined `notifications` block, and
a `runtimeAction` reference to a `workerProcess` operation. The generated `registration` JSON
uses this same v2 shape — the new Admin UI SDK extension reads it directly without an
intermediate v1 wire-format transformation.

**This SDK removes `commerce/backend-ui/1` generation entirely.** From this release on, the
SDK only emits `commerce-backend-ui-2/`. Apps already deployed with a `commerce-backend-ui-1/`
folder continue to function in Adobe Commerce admin because the generated files are static and
do not depend on this SDK at runtime — but any subsequent `aio app build` or
`pre-app-build` run on those projects with a newer SDK version will produce
`commerce-backend-ui-2/` instead.

## Motivation

The mass-action shape that app developers write today mixes UI flows and backend flows behind a
single boolean (`displayIframe`). The same `path` field means two different things depending on
that boolean, runtime-action invocations are wired through a relative-path "hack", and the
success/error messages for an action live in a separate top-level block
(`bannerNotification.massActions`) cross-referenced by `actionId`. The result is a config that
is hard to read, hard to author correctly, and easy to break by renaming an `actionId` in one
place but not the other.

**Goals**

- Generate code for `commerce/backend-ui/2` instead of `commerce/backend-ui/1`. This SDK no
  longer produces `commerce-backend-ui-1/`; existing folders in deployed apps keep working as
  static files.
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
- Update fixtures and tests to use the v2 input shape.
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
        type: "view",
        path: "#/tag-customers",
        sandbox: "allow-modals",
        selectionLimit: 100,
        installation: {
          label: "Tag customers",
          description: "Adds a bulk action to tag selected customers from the grid.",
        },
        notifications: {
          success: "Customers tagged successfully",
          error: "Could not tag the selected customers",
        },
      },
      {
        id: "export-customers",
        label: "Export selected customers",
        type: "worker",
        runtimeAction: "customers/export-customers", // matches the workerProcess `impl` verbatim
        timeout: 30,
        selectionLimit: 1000,
        installation: {
          label: "Export customers",
          description: "Adds a bulk action to export selected customers as CSV.",
        },
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
| `notifications`  | optional       | optional         |
| `installation`   | optional       | optional         |
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

### What does not change

- The other Admin UI SDK extension blocks (menu items, grid columns, view buttons, custom
  fees, banner notifications for view buttons) continue to use their v1 shape. Only mass
  actions move to v2 in this ticket.

## Design

The SDK serializes the v2 input verbatim into
`src/commerce-backend-ui-2/.generated/actions/registration/index.js`, with one small
transform: `id` is prefixed with `${metadata.id}::` to produce the final `actionId` consumed
by the Admin UI SDK extension. No other field renames or structural changes — the new
extension reads the v2 shape directly.

### Tests

- `test/unit/config/schema/admin-ui-sdk.test.ts` — rewritten to assert the variant behavior
  (each `type` accepts its own fields and rejects the other's) and the unified
  `selectionLimit` rename.
- `test/fixtures/config.ts` — `configWithAdminUiSdk` and `configWithFullAdminUiSdk` rewritten
  in v2 input shape.
- `test/unit/commands/generate/actions/config.test.ts` — `BACKEND_UI_EXTENSION_MATCHER`
  updated to `/EXTENSION=backend-ui\/2/`.
- `test/integration/commands/hooks/pre-app-build.test.ts` — `"backend-ui/1"` → `"backend-ui/2"`,
  plus an assertion that the generated JSON contains the v2 shape with the `${metadata.id}::`
  prefix applied to `actionId`.

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
