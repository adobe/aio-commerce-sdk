# Admin UI menu on backend-ui/2

- **Ticket:** [CEXT-6315](https://jira.corp.adobe.com/browse/CEXT-6315)
- **Created:** 2026-06-04
- [ ] **Implemented**

## Summary

Adds `menu` support to the v2 Admin UI schema under `adminUi`, on
`commerce/backend-ui/2`. Unlike the v1 `adminUiSdk.registration.menuItems` array, the v2 shape is a
single `adminUi.menu` object. A per-app section is created automatically from app metadata when no
explicit Commerce menu is configured; developers only describe the app's menu entry and target
page. The v2 shape intentionally breaks from v1 by renaming `title` to `label`, replacing parent
menu configuration with `commerceMenuId`, adding `description`, flattening `page.title` to
`pageTitle`, removing developer-defined sections, and renaming `sandbox` to `sandboxPermissions`.
No registration action is generated for `commerce/backend-ui/2`; the `adminUi` config is read from
the existing `app-config` endpoint on `commerce/extensibility/1`.

## Motivation

The v1 menu schema exposes too much of Commerce's menu tree mechanics to app developers. The
existing documented model is an array of `menuItems`, where one item can be a section
(`isSection: true`) and another item points at it through `parent`. In practice, each application
is limited to one section and one menu, so developers have to model a tree shape that the platform
does not actually let them use.

This creates avoidable authoring problems:

1. **Developers must create their own app section.** A common v1 config contains both a section
   entry and a child menu entry. The section title duplicates app metadata and adds a second ID
   that must stay in sync with the child's parent reference.
2. **Parent IDs are ambiguous.** `parent` and the proposed `parentMenuId` naming read as if the app
   can target either app-created sections or Commerce-owned menu entries. On Adobe Commerce as a
   Cloud Service, developers may not know the Commerce menu tree well enough to choose these
   values reliably.
3. **Ordering is not a stable app concern.** v1 exposes `sortOrder`, but that only makes sense
   relative to sibling menu items in a section. When v2 creates one app-owned section and one
   app-owned menu entry, developer-controlled ordering is either redundant or an installation-time
   Commerce concern.
4. **Menu and page metadata are split.** The v1 menu entry has `title`, while the page extension
   point has its own `page.title`. Developers have to understand two related extension points to
   define one admin entry point.

**Goals**

- Add a singular `adminUi.menu` object for `commerce/backend-ui/2`.
- Replace v1 `menuItems[]` with one menu declaration per app.
- Rename `title` to `label`.
- Add `description` for installation and permission review surfaces.
- Replace `parent` / `parentMenuId` with `commerceMenuId`, an optional reference to an existing
  Commerce menu where the app menu should be attached.
- Flatten page metadata into `pageTitle`; no nested `page` object is exposed in v2.
- Remove developer-defined sections. When `commerceMenuId` is omitted, a per-app section is created
  automatically using the app's metadata ID and display name, and that section becomes the default
  parent for the app menu.
- Rename `sandbox` to `sandboxPermissions` to make the field's purpose explicit.
- Express `sandboxPermissions` as an array of allowed string values instead of a space-separated
  string.
- Remove `sortOrder` from the developer config; Commerce/App Management owns menu ordering.
- Ensure a `view` operation is declared in `ext.config.yaml` when `adminUi.menu` is present.
- Scaffold the React web entry needed for the menu page rendered in Commerce, including Experience
  Cloud shell bootstrap, Admin UI SDK registration, shared-context attachment, and routing to the
  app page.
- Update the generated OpenAPI schema so `adminUi.menu` is documented in the `app-config`
  contract.
- Deprecate `adminUiSdk.registration.menuItems`; keep it functional until the v1 Admin UI SDK
  removal window.

**Non-goals**

- Deprecating or removing unrelated `adminUiSdk.registration` features. This spec only covers
  `menuItems`.
- Supporting multiple menu entries in one app. The v2 shape preserves the platform limit of one app
  section and one menu.
- Letting apps create arbitrary Commerce menu sections or nested menu trees.
- Adding ACL resources to menu declarations. ACL is handled outside this ticket.
- Adding a menu `path`. Commerce resolves the menu to the app's registered web view; the app owns
  its internal routing.
- Letting app developers control menu ordering with `sortOrder`.

## Developer experience

### Defining a menu

```ts
// app.commerce.config.ts
export default defineConfig({
  metadata: {
    id: "purchase-approval",
    displayName: "Purchase Approval",
    description: "Approve purchase requests from Commerce Admin.",
    version: "1.0.0",
  },
  adminUi: {
    menu: {
      id: "approval-dashboard",
      label: "Approval Dashboard",
      description: "Review and approve purchase requests from Commerce Admin.",
      pageTitle: "Purchase Approval Dashboard",
      commerceMenuId: "Magento_Sales::sales",
      sandboxPermissions: ["allow-popups", "allow-downloads"],
    },
  },
});
```

This creates one Commerce Admin entry for the app and attaches it to the existing
`Magento_Sales::sales` Commerce menu. When the merchant clicks the entry, the app's registered web
view is loaded and `pageTitle` is displayed as the Admin page title.

`description` is a short explanation of what the menu entry does. It is not rendered as the menu
label; it is exposed through app config and OpenAPI so installation and permission-review surfaces
can describe the menu entry before it is enabled.

`commerceMenuId` is optional. When present, it references an existing Commerce menu item under which
the app menu should be attached; this lets an app appear under Commerce menus such as Sales,
Catalog, or any other known Commerce menu ID instead of only under an app-owned section. When
absent, a dedicated section is created automatically using `metadata.id` and
`metadata.displayName`, and that generated section becomes the default parent for the app menu.
The SDK validates that `commerceMenuId`, when provided, is a non-empty string, but does not
validate that the referenced Commerce menu ID exists; that check belongs to Commerce/App Management
because the available menu tree is Commerce-version and installation dependent.

`sandboxPermissions` uses the same iframe sandbox permission values accepted by v1 `sandbox`, but
the values are declared as an array instead of a space-separated string. Valid values remain
`allow-downloads`, `allow-modals`, and `allow-popups`.

### Generated extension config

When `adminUi.menu` is present, the SDK ensures `commerce/backend-ui/2` declares a `view` operation
pointing at the app's web entry (`index.html` by default). Developers do not declare the operation
by hand.

Example generated `ext.config.yaml` excerpt:

```yaml
hooks:
  pre-app-build: "EXTENSION=backend-ui/2 $packageExec aio-commerce-lib-app hooks pre-app-build"
operations:
  view:
    - type: web
      impl: index.html
```

The SDK also scaffolds the React web code needed for the menu page rendered in Commerce. The
scaffold follows the pattern from the Commerce menu sample: the web entry bootstraps the Experience
Cloud shell, routes to an Admin UI SDK registration component, registers the extension, attaches to
the shared context to read Commerce-provided IMS data when needed, and then renders the app page.
Developers should not have to copy the sample `App.js`, `ExtensionRegistration`, and shared-context
attachment wiring by hand for a generated SDK app.

No `workerProcess` operation is generated for the menu. No registration action is generated. The
menu declaration is read from the `app-config` endpoint on `commerce/extensibility/1`.

### Migration from v1

| v1                                       | v2                      | Notes                                                          |
| ---------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `adminUiSdk.registration.menuItems[]`    | `adminUi.menu`          | Singular object; one menu per app                              |
| `menuItems[].id`                         | `id`                    | Unchanged meaning; app-declared menu identifier                |
| `menuItems[].title`                      | `label`                 | Menu label rendered in Commerce Admin                          |
| _(absent)_                               | `description`           | Human-readable menu summary for installation and permissions   |
| `page.title`                             | `pageTitle`             | Flattened into the menu declaration                            |
| `menuItems[].parent` / `parentMenuId`    | `commerceMenuId`        | Optional existing Commerce menu where the app menu is attached |
| `menuItems[].sandbox`                    | `sandboxPermissions`    | Same permission values, now expressed as a string array        |
| `menuItems[].isSection`                  | _(removed)_             | Omit `commerceMenuId` to use an app-specific generated section |
| `menuItems[].sortOrder`                  | _(removed)_             | Ordering is owned by Commerce/App Management                   |
| Extension point: `commerce/backend-ui/1` | `commerce/backend-ui/2` | Required change in `app.config.yaml` and `install.yaml`        |

During migration, developers identify the v1 non-section menu item and move its user-facing title
to `adminUi.menu.label`. The v1 section item is not migrated. If the v1 app used a custom parent
menu ID, that value moves to `commerceMenuId`; otherwise `commerceMenuId` can be omitted and an
app-specific section is generated automatically from app metadata. If the v1 app configured a page
title separately through the page extension point, that value moves to `pageTitle`.

Both v1 and v2 can coexist during the transition. Once the app has moved its menu to `adminUi.menu`,
the `adminUiSdk.registration.menuItems` block can be removed.

## Design

### Schema extension

The v2 schema introduced in CEXT-6096 lives in
`packages/aio-commerce-lib-app/source/config/schema/admin-ui.ts`. This change extends
`AdminUiSchema` with an optional top-level `menu` object:

```ts
const MenuSchema = v.object({
  id: nonEmptyStringValueSchema("menu ID"),
  label: nonEmptyStringValueSchema("menu label"),
  description: nonEmptyStringValueSchema("menu description"),
  pageTitle: nonEmptyStringValueSchema("menu page title"),
  commerceMenuId: v.optional(nonEmptyStringValueSchema("Commerce menu ID")),
  sandboxPermissions: v.optional(SandboxPermissionsSchema),
});

export const AdminUiSchema = v.object({
  menu: v.optional(MenuSchema),
  order: v.optional(v.object({ gridColumns: v.optional(GridColumnsSchema) })),
  product: v.optional(v.object({ gridColumns: v.optional(GridColumnsSchema) })),
  customer: v.optional(
    v.object({ gridColumns: v.optional(GridColumnsSchema) }),
  ),
});
```

`SandboxPermissionsSchema` validates the same values as the v1 `SandboxSchema`, but accepts them as
array entries and reports errors against `sandboxPermissions`:

```ts
const SandboxPermissionSchema = v.picklist([
  "allow-downloads",
  "allow-modals",
  "allow-popups",
]);

const SandboxPermissionsSchema = v.array(SandboxPermissionSchema);
```

The v1 `MenuItemSchema` in `admin-ui-sdk.ts` remains functional, but its exported `MenuItem` type is
marked `@deprecated`.

### App-config payload

The `app-config` endpoint returns `adminUi.menu` as declared by the app after validation. The SDK
does not prefix `id`, does not synthesize `commerceMenuId`, and does not include the automatically
created app section in the payload. Commerce/App Management is responsible for interpreting the
menu declaration, generating the app-specific section when `commerceMenuId` is omitted, and
resolving `commerceMenuId` against the Commerce menu tree when it is provided.

Example payload excerpt:

```json
{
  "metadata": {
    "id": "purchase-approval",
    "displayName": "Purchase Approval",
    "description": "Approve purchase requests from Commerce Admin.",
    "version": "1.0.0"
  },
  "adminUi": {
    "menu": {
      "id": "approval-dashboard",
      "label": "Approval Dashboard",
      "description": "Review and approve purchase requests from Commerce Admin.",
      "pageTitle": "Purchase Approval Dashboard",
      "commerceMenuId": "Magento_Sales::sales",
      "sandboxPermissions": ["allow-popups", "allow-downloads"]
    }
  }
}
```

### OpenAPI

The OpenAPI document generated for the `app-config` endpoint must include the `adminUi.menu` schema
in the same implementation change. The schema marks `id`, `label`, `description`, and `pageTitle`
as required strings, exposes `commerceMenuId` as an optional string, and exposes
`sandboxPermissions` as an optional array whose items are limited to the supported sandbox
permission values. The implementation PR is not complete unless the OpenAPI generation code and
its relevant tests or fixtures are updated with this schema.

### Pre-app-build hook

The `commerce/backend-ui/2` pre-app-build path already updates `ext.config.yaml` for v2 Admin UI
features. This change adds one generation rule:

- If `adminUi.menu` is present, ensure the extension declares a `view` operation pointing at the
  app's web entry (`index.html` by default).
- If `adminUi.menu` is present, ensure the generated React web scaffold bootstraps the Experience
  Cloud shell, registers with the Admin UI SDK, attaches to the shared context, and routes to the
  app page that Commerce renders after the menu item is clicked.

If a `view` operation already exists, the SDK leaves it untouched. If other v2 features also need a
`view` operation, they share the same operation.

No menu-specific registration action is generated. `adminUi.menu` is read from the `app-config`
endpoint.

### Validation rules

- `menu` must be an object, not an array.
- `id`, `label`, `description`, and `pageTitle` are required non-empty strings.
- `commerceMenuId` is optional, but when present must be a non-empty string. When omitted, the
  Commerce-side registration uses a generated app-specific section as the parent menu ID.
- `sandboxPermissions` is optional, but when present must be an array containing only sandbox values
  from the supported allowlist.
- `isSection`, `parent`, `parentMenuId`, `title`, `page`, `sandbox`, and `sortOrder` are not valid
  under `adminUi.menu`.

Misuse produces build-time validation errors, e.g.:

```text
Field "menu" must be an object
Field "label" is required for adminUi.menu
Field "sortOrder" is not allowed under adminUi.menu
```

### Changeset bump

`minor`. This adds a new v2 Admin UI config surface while the broader `adminUi` API remains
experimental. The v1 `menuItems` shape stays functional during the deprecation window.

## Drawbacks

- Apps that relied on v1 `sortOrder` lose direct ordering control in the SDK config. This is
  intentional because v2 treats placement and ordering as Commerce/App Management responsibilities,
  but reviewers should confirm that the installation UI has an acceptable ordering policy.
- Apps that previously used multiple `menuItems` in one config cannot express that in v2. This
  matches the documented platform limit of one section and one menu per app, but it means unusual
  v1 configs must be split into separate apps or remain on v1 until a broader menu model exists.
- `commerceMenuId` can only be validated at runtime by Commerce/App Management. The SDK can enforce
  that it is a string, but not that the target exists in every Commerce version.

## Rationale and alternatives

**Reuse the v1 `menuItems` array.**
Rejected. The array implies arbitrary menu tree construction, but the platform supports one section
and one menu per app. A singular object is simpler and matches the actual product constraint.

**Keep developer-defined sections through `isSection`.**
Rejected. A generated app-specific section can be derived from `metadata.id` and
`metadata.displayName`, removing one ID, one label, and one parent reference from the developer
config.

**Keep `title` instead of renaming it to `label`.**
Rejected. Other v2 Admin UI surfaces use `label` for text rendered in Commerce Admin. `pageTitle`
then names the separate page-level title explicitly.

**Keep `parent` / `parentMenuId`.**
Rejected. Both names describe generic tree mechanics rather than the developer's intent.
`commerceMenuId` makes clear that the field references an existing Commerce menu ID. When it is
omitted, the parent menu ID is the generated app-specific section.

**Keep a nested `page: { title }` object.**
Rejected. The v2 menu is the only place where page metadata is configured, and the page object has
only one field. `pageTitle` is flatter and removes an unnecessary wrapper.

**Keep `sortOrder`.**
Rejected. With one app section and one menu entry, app-local ordering is redundant. Ordering among
multiple installed apps is not something one app can decide safely in isolation, especially across
Commerce editions and deployments. Commerce/App Management should own that policy.

**Impact of not doing this.**
The v2 Admin UI migration remains incomplete: apps that need an Admin menu must keep
`adminUiSdk.registration.menuItems` configured alongside `adminUi`, and developers continue to
author section/menu pairs that the platform could derive for them.

## Unresolved questions

None.

## Future possibilities

- Removal of `adminUiSdk.registration.menuItems` alongside the broader `commerce/backend-ui/1`
  removal work.
- Typed constants or discovery tooling for Commerce menu IDs, if App Management exposes the
  available Commerce menu tree in the future.
