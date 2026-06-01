# Admin UI SDK mass actions v2

- **Ticket:** [CEXT-6095](https://jira.corp.adobe.com/browse/CEXT-6095)
- **Created:** 2026-05-29
- [ ] **Implemented**

## Summary

Move the Admin UI SDK code generation from extension point `commerce/backend-ui/1` to the new
`commerce/backend-ui/2`, and replace the mass-action input schema in `app.commerce.config.*` with
a cleaner shape that uses an explicit `type` discriminator, an inlined `notifications` block, and
a `backend` reference to a `workerProcess` operation. The wire-format JSON written to
`.generated/actions/registration/index.js` — the payload Adobe Commerce actually reads — remains
unchanged, so existing Commerce admin behavior is preserved.

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

See the ([spike](https://wiki.corp.adobe.com/spaces/DMSArchitecture/pages/3872493513/Spike+Admin+UI+SDK+Specs))

**Goals**

- Generate code for `commerce/backend-ui/2` instead of `commerce/backend-ui/1`. This SDK no
  longer produces `commerce-backend-ui-1/`; existing folders in deployed apps keep working as
  static files.
- Replace the mass-action input schema with the v2 shape:
  - `id` (renamed from `actionId`).
  - `type: "ui" | "worker"` discriminator (replaces the `displayIframe` boolean).
  - `backend: "<operation-name>"` for `type: "worker"`, referencing a `workerProcess` operation
    declared in `app.config.yaml`.
  - Inlined `notifications: { success?, error? }`, replacing the standalone
    `bannerNotification.massActions.<grid>[]` cross-reference.
  - Field applicability enforced by the schema (e.g. `sandbox` only valid for `type: "ui"`,
    `timeout` only valid for `type: "worker"`).
- Keep the generated `registration` JSON wire-format identical to what Adobe Commerce reads
  today, so Commerce admin behavior is preserved.
- Update fixtures and tests to use the v2 input shape; assertions on the generated wire-format
  remain unchanged.

**Non-goals**

- Migrating the other v1 chapters (menu items, grid columns, view buttons, custom fees, banner
  notifications for view buttons) to v2. They are still authored in their v1 shape; only mass
  actions move.
- Removing the standalone `bannerNotification.orderViewButtons` block — that belongs to a
  different chapter and is preserved unchanged.
- Cross-file validation that `backend: "<name>"` actually matches a `workerProcess` operation
  declared in `app.config.yaml`. The schema validates that `backend` is a non-empty string;
  validating the reference is a follow-up.
- Removing `commerce/backend-ui/1` support from Adobe Commerce admin. That is a separate
  decision owned by the Admin UI SDK team; this spec only covers SDK-side generation.

## Developer experience

### Authoring a mass action

Before this feature, both UI and backend mass actions share one shape, with `displayIframe`
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
notifications, and a `backend` reference instead of a hand-rolled path for the worker case:

```ts
// v2 — new shape
adminUiSdk: {
  registration: {
    customer: {
      massActions: [
        {
          id: "my-app::tag-customers",
          label: "Tag selected customers",
          type: "ui",
          path: "#/tag-customers",
          sandbox: "allow-modals",
          selectionLimit: 100,
          notifications: {
            success: "Customers tagged successfully",
            error: "Could not tag the selected customers",
          },
        },
        {
          id: "my-app::export-customers",
          label: "Export selected customers",
          type: "worker",
          backend: "export-customers", // matches the workerProcess operation name
          timeout: 30,
          selectionLimit: 1000,
          notifications: {
            success: "Customers exported successfully",
            error: "Could not export customers",
          },
        },
      ],
    },
  },
}
```

Operations referenced from `backend` must be declared on `commerce/backend-ui/2` in
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

| Field            | `type: "ui"` | `type: "worker"` |
| ---------------- | ------------ | ---------------- |
| `id`             | required     | required         |
| `label`          | required     | required         |
| `title`          | optional     | optional         |
| `confirm`        | optional     | optional         |
| `notifications`  | optional     | optional         |
| `selectionLimit` | optional     | optional         |
| `path`           | **required** | rejected         |
| `sandbox`        | optional     | rejected         |
| `backend`        | rejected     | **required**     |
| `timeout`        | rejected     | optional         |

Misuse produces a clear validation error at build time, e.g.:

```
Field "backend" is not allowed when type is "ui"
Field "path" is required when type is "ui"
```

### `selectionLimit` rename

The order, product, and customer grids each used a differently named limit field today
(`selectionLimit`, `productSelectLimit`, `customerSelectLimit`). In v2 they unify to
`selectionLimit` across all three grids. The wire-format key written to the generated JSON
remains grid-specific (`orderSelectLimit` / `productSelectLimit` / `customerSelectLimit`) so
Commerce admin behavior is unchanged.

### What does not change

- The contents of the runtime action at
  `src/commerce-backend-ui-2/.generated/actions/registration/index.js` follow the same
  template as today — only the directory name and the registration JSON literal differ. The
  response shape served to Commerce admin is byte-equivalent to v1 for an equivalent input.
- The other Admin UI SDK extension blocks (menu items, grid columns, view buttons, custom
  fees, banner notifications for view buttons) continue to use their v1 shape. Only mass
  actions move to v2 in this ticket.

## Design

### Wire-format invariant

The string written to `.generated/actions/registration/index.js` (specifically the value bound
to `const registration = …`) must match — for an equivalent input — what the v1 SDK produces
today. Concretely: same field names, same value shapes, same ordering of keys is not required
but the resulting object semantics must be indistinguishable for Adobe Commerce admin.

This means the SDK builds an internal "wire" view of the registration at generation time,
distinct from the v2 input the developer authored, and stringifies the wire view. The
transformation lives in the generation pipeline, not in the runtime action.

### Mapping v2 input → wire-format

| v2 input field                     | Wire-format mapping                                                  |
| ---------------------------------- | -------------------------------------------------------------------- |
| `id`                               | `actionId`                                                           |
| `type: "ui"`                       | `displayIframe: true` (default in v1, kept explicit for clarity)     |
| `type: "worker"`                   | `displayIframe: false`                                               |
| `path` (under `type: "ui"`)        | `path` (passed through)                                              |
| `backend` (under `type: "worker"`) | **Open question — see Unresolved questions**                         |
| `sandbox`                          | `sandbox`                                                            |
| `timeout`                          | `timeout`                                                            |
| `selectionLimit` (order grid)      | `orderSelectLimit`                                                   |
| `selectionLimit` (product grid)    | `productSelectLimit`                                                 |
| `selectionLimit` (customer grid)   | `customerSelectLimit`                                                |
| `notifications.success`            | `bannerNotification.massActions.<grid>[].successMessage` (collected) |
| `notifications.error`              | `bannerNotification.massActions.<grid>[].errorMessage` (collected)   |

`notifications` is inlined on the action in v2; the wire-format still expects it under
`bannerNotification.massActions.<grid>` cross-referenced by `actionId`. The generator walks each
grid's `massActions`, collects entries that declare any `notifications`, and emits the matching
banner objects under the `bannerNotification.massActions.<grid>` array — matching the v1 wire
shape exactly.

### Tests

- `test/unit/config/schema/admin-ui-sdk.test.ts` — rewritten to assert the variant behavior
  (each `type` accepts its own fields and rejects the other's), inlined `notifications`, the
  unified `selectionLimit` rename, and the removed `bannerNotification.massActions` block.
- `test/fixtures/config.ts` — `configWithAdminUiSdk` and `configWithFullAdminUiSdk` rewritten
  in v2 input shape.
- `test/unit/commands/generate/actions/config.test.ts` — `BACKEND_UI_EXTENSION_MATCHER`
  updated to `/EXTENSION=backend-ui\/2/`.
- `test/integration/commands/hooks/pre-app-build.test.ts` — `"backend-ui/1"` → `"backend-ui/2"`,
  plus an assertion that the generated registration JSON still contains the v1 wire-format
  keys (`actionId`, `displayIframe`, `orderSelectLimit`/`productSelectLimit`/`customerSelectLimit`,
  the `bannerNotification.massActions.<grid>` entries derived from inlined notifications).
- A new unit test for `transformRegistrationToWireFormat` covers the mapping table above in
  isolation, including the notifications-to-banner collection.

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

- Within a single `adminUiSdk.registration` block, mass actions use the v2 shape while other
  chapters (menu items, grid columns, view buttons, custom fees) still use the v1 shape.
  Inconsistent until subsequent tickets migrate them.
- The generated `registration` JSON uses different field names than the developer writes
  (`actionId` not `id`, `displayIframe` not `type`). Mildly confusing when debugging the
  generated file.

## Unresolved questions

Given this mass action input when is type worker:

```ts
{
  id: `${extensionId}::export-customers`,
  label: "Export selected customers",
  type: "worker",
  backend: "export-customers", // references a workerProcess operation
  selectionLimit: 1000,
  timeout: 30, // seconds; optional; default 10
  confirm: { title: "Export", message: "Export to CSV?" },
  notifications: {
    success: "Customers exported successfully",
    error: "Could not export customers",
  },
}
```

And this `app.config.yaml`:

```yaml
extensions:
  commerce/backend-ui/2:
    operations:
      view:
        - type: web
          impl: index.html # SPA used by type:'ui' mass actions
      workerProcess:
        - type: action
          impl: customers/export-customers # runtime action; codegen scaffolds this
```

How is the wire-format `path` generated? There is no field linking `backend: "export-customers"`
to `impl: customers/export-customers` — App Builder's `workerProcess` operations have no `name`
or `id` field.

## Future possibilities

- Migrate the remaining Admin UI SDK chapters to v2 and retire the v1 schema from the SDK.
- Support async backend mass actions (flagged as an open thread in the wiki spec).
- Drop the wire-format transformation once Commerce admin reads the v2 shape natively.
