# Admin UI SDK — Per-item ACL resources

- **Ticket:** [CEXT-6150](https://jira.corp.adobe.com/browse/CEXT-6150)
- **Created:** 2026-06-16
- [x] **Implemented** (menu branch only; grid columns, view buttons, mass actions deferred)

## Summary

Introduces `aclProtected` support for v2 Admin UI items. When an app developer marks an item as
`aclProtected: true`, the SDK automatically generates a deterministic, hierarchically nested ACL
resource for it in the Commerce Admin User Roles tree. The resulting tree groups per-app items under
an app node, and per-type items under an item-type group node — giving administrators fine-grained,
readable permission controls without requiring any manual ACL configuration from developers.

The full design covers four item types: menu, order/product/customer grid columns, order view buttons,
and mass actions. **This ticket implements the menu branch only.** Grid columns, view buttons, and mass
actions ship in follow-up PRs.

## Motivation

Commerce Admin User Roles provide a well-understood permission model: administrators assign roles, and
each role grants or denies specific ACL resources in a tree. App developers building on the Admin UI
SDK need a way to participate in this model so that:

- A merchant can restrict which admin users see which app menu entries, grid columns, or action
  buttons — without having to configure anything outside the standard User Roles screen.
- Permissions are readable: the User Roles tree shows the app name, the item type, and the individual
  item label, so an administrator can tell at a glance what each checkbox controls.
- Permissions are granular: an administrator can grant access to one menu entry, or to all items in
  an app at once by checking the app-level node.
- App developers do not need to maintain ACL XML, think about ACL resource id uniqueness, or
  understand the Commerce ACL tree internals. A single boolean field in the app config is enough.

**Goals**

- Introduce `aclProtected: true` as an opt-in field on `adminUi.menu` (and in follow-up PRs, on
  grid columns, view buttons, and mass actions).
- Generate one deterministic ACL resource per protected item, derived from the app's `metadata.id`
  and the item's `id`.
- Render the resources as a nested Commerce ACL tree: an "Apps permissions" container → app node →
  item-type group node → per-item leaf node.
- Enforce server-side: a protected menu entry is hidden and its direct URL is blocked for admin roles
  that do not hold the generated ACL resource.
- Expose SDK helpers so apps can check permissions programmatically against the same ids without
  hardcoding strings.
- Keep Commerce core ACL safe: SDK tree injection is fail-safe, and SDK-generated ids never collide
  with static Commerce ACL nodes.

**Non-goals**

- Grid columns, view buttons, and mass actions — covered in separate follow-up PRs.
- Custom ACL resource names from app developers. Ids are derived entirely from metadata.
- Letting administrators define their own permission names for SDK items.
- Any new schema fields beyond `aclProtected`.

## Developer experience

### Declaring a protected menu item

App developers add `aclProtected: true` to `adminUi.menu`. No other ACL configuration is needed:

```ts
// app.commerce.config.ts
export default defineConfig({
  metadata: {
    id: "approval-dashboard-app",
    displayName: "Approval Dashboard Application",
    description: "Approval tools for Commerce Admin.",
    version: "1.0.0",
  },
  adminUi: {
    menu: {
      id: "approval_dashboard",
      label: "Approval Dashboard",
      parentMenu: "sales",
      aclProtected: true,
    },
  },
});
```

The SDK derives all ACL resource ids automatically from `metadata.id` and `menu.id`. Developers do
not write ACL ids, do not maintain `acl.xml`, and do not call any SDK helpers during registration.

When `aclProtected` is omitted or `false`, the menu entry uses a shared SDK-level resource and no
per-item permission is created.

### Commerce Admin — User Roles tree

After installation, the User Roles resource tree contains:

```
Apps permissions
└── Approval Dashboard Application
    └── Menu
        └── Approval Dashboard
```

An administrator can grant or deny any level:

- Granting **Approval Dashboard Application** covers all protected items in the app.
- Granting **Menu** covers all protected menu items for that app.
- Granting **Approval Dashboard** covers only that specific menu entry.

Denying **Approval Dashboard** hides the menu entry and blocks direct URL access for that admin role,
while leaving any other items in the "Approval Dashboard Application" subtree accessible.

### SDK permission client — checking permissions programmatically

Apps that want to verify permissions at runtime use `getMenuAclResourceId` from
`@adobe/aio-commerce-lib-admin-ui`. This produces the same id that Commerce uses, so the check is
always in sync with the server-side enforcement:

```ts
import {
  getMenuAclResourceId,
  createPermissionClient,
} from "@adobe/aio-commerce-lib-admin-ui";

const client = createPermissionClient({
  /* ... */
});

const resourceId = getMenuAclResourceId(
  "approval-dashboard-app",
  "approval_dashboard",
);
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard"

const allowed = await client.check(resourceId);
```

`getMenuAclResourceId` is a pure string operation — no network call, no async. It can be used in any
context where the app needs the canonical id string.

To check whether an admin role has access to **any** item in the app, use the app-root id:

```ts
import { getAclResourceId } from "@adobe/aio-commerce-lib-admin-ui";

const appRootId = getAclResourceId("approval-dashboard-app");
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app"

const hasAnyAccess = await client.check(appRootId);
```

### Behavior when `aclProtected: true` but no app id is available

If `metadata.id` cannot be resolved at registration time, the Commerce module logs a warning and falls
back to the shared SDK resource. The menu entry remains registered and visible to all admin roles that
hold the shared resource. This prevents a misconfiguration from silently breaking the app.

## Design

### Full tree example

The tree below shows how a single app with multiple protected item types is represented in the User
Roles screen. This is the target state across all phases; only the Menu branch ships in this ticket.

```
Apps permissions
└── Approval Dashboard Application
    ├── Menu
    │   ├── Approval Dashboard
    │   └── Pending Reviews
    ├── Order
    │   ├── Grid Columns
    │   │   ├── Approval Status
    │   │   └── Reviewer
    │   ├── View Buttons
    │   │   └── Approve Order
    │   └── Mass Actions
    │       ├── Bulk Approve
    │       └── Bulk Reject
    ├── Product
    │   ├── Grid Columns
    │   │   └── Approval Required
    │   └── Mass Actions
    │       └── Flag for Review
    └── Customer
        └── Grid Columns
            └── Approval Tier
```

An administrator granting **Approval Dashboard Application** covers every item beneath it across all
entity types. Granting **Order** covers all order-related items. Granting **Grid Columns** under
**Order** covers only the order grid column leaves, leaving view buttons and mass actions unaffected.

### Id scheme

All ACL resource ids follow a single hierarchical pattern built from the app's `metadata.id` and the
item's `id`. Each segment is independently sanitized (trimmed, lowercased, non-alphanumeric characters
replaced with underscores) and joined with `_` under a fixed module prefix.

| Node                                | Example id                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| App root                            | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app`                          |
| Menu group                          | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu`                     |
| Menu leaf                           | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard`  |
| Order grid-columns group (deferred) | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_gridcolumns`        |
| Order grid-column leaf (deferred)   | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_gridcolumns_status` |

**Item-type tokens** (canonical, immutable once shipped):

| Item type    | Entity   | Token                  |
| ------------ | -------- | ---------------------- |
| Menu         | —        | `menu`                 |
| Grid columns | Order    | `order_gridcolumns`    |
| Grid columns | Product  | `product_gridcolumns`  |
| Grid columns | Customer | `customer_gridcolumns` |
| View buttons | Order    | `order_viewbuttons`    |
| Mass actions | Order    | `order_massactions`    |
| Mass actions | Product  | `product_massactions`  |
| Mass actions | Customer | `customer_massactions` |

### Commerce module — ACL tree generation

The Commerce module (`Magento_CommerceBackendUix`) is responsible for generating and injecting the
ACL resource tree at runtime. The key behaviours are:

- **Id generation** — a dedicated generator derives all ACL ids from the app's `metadata.id` and
  item-type tokens. The algorithm is the authoritative source; the SDK helper mirrors it exactly.
- **Tree building** — when registrations are loaded, the module collects all ACL-protected items,
  merges their ancestor paths into a shared node map (so two menu items from the same app share one
  app node), validates each id against the static Commerce ACL tree to prevent collisions, and
  produces a nested node structure.
- **Tree injection** — the nested structure is injected into the Commerce Admin User Roles tree under
  an "Apps permissions" container attached to the module's static parent node. The injection is
  fail-safe: any error during injection returns the original unmodified Commerce tree so core ACL is
  never broken.
- **Enforcement** — each ACL-protected menu item carries its leaf ACL resource id as its Commerce
  `resource` field. Commerce's native menu builder and admin page access control use this field to
  hide items and block direct URL access for roles that do not hold the resource.

### SDK — `getMenuAclResourceId`

`getMenuAclResourceId(appId: string, menuId: string): string` is added to
`@adobe/aio-commerce-lib-admin-ui`. It applies the same sanitization as the Commerce module's id
generator and produces the canonical leaf id for a menu item. It is a pure synchronous function with
no dependencies.

Exported from the package's public API alongside the existing `getAclResourceId` (app-root id).

### Cross-repo id contract

The sanitization algorithm and module prefix are a shared contract between the Commerce module and the
SDK helper. Any change to either side must be coordinated and reflected in both. The table below is
the authoritative fixture both test suites assert against:

| `appId`                  | item type          | `itemId`             | Generated id                                                                                       |
| ------------------------ | ------------------ | -------------------- | -------------------------------------------------------------------------------------------------- |
| `approval-dashboard-app` | menu               | `approval_dashboard` | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard`        |
| `My-App`                 | menu               | `My-Item`            | `Magento_CommerceBackendUix::adminuisdk_app_my_app_menu_my_item`                                   |
| `approval-dashboard-app` | order grid columns | `order_status`       | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_gridcolumns_order_status` |
| `approval-dashboard-app` | order mass actions | `bulk-approve`       | `Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_massactions_bulk_approve` |

### Phased rollout

| Phase         | Ticket | Item types covered                             |
| ------------- | ------ | ---------------------------------------------- |
| 1 — CEXT-6150 | Menu   |
| 2             | TBD    | Order grid columns, view buttons, mass actions |
| 3             | TBD    | Product grid columns, mass actions             |
| 4             | TBD    | Customer grid columns, mass actions            |

The Commerce module's tree-building plumbing is generic. Each follow-up phase adds item-type support
without changes to the core registry or injection logic.

## Drawbacks

- Generating one ACL node per item means a large number of items creates a proportionally large ACL
  subtree. In practice apps have O(1–10) items per type, so this is manageable, but should be
  monitored for apps with large grid column sets.
- `aclProtected: false` (or absent) items use a shared resource with no per-item control. This is
  intentional — the field is opt-in — but means some items are not individually grantable.

## Rationale and alternatives

**One shared ACL resource per app, regardless of item.**
Rejected. It provides no item-level or type-level control. An administrator cannot grant access to
one menu entry without also granting every other item in the app.

**Let developers specify ACL ids manually.**
Rejected. Manual ids create a coordination burden (must be unique across all registered apps globally),
are error-prone, and break the zero-configuration developer experience goal.

**A flat list with one entry per item (no grouping nodes).**
Rejected. A flat list is readable but forces an administrator to check every individual checkbox to
grant access to all items in an app or all items of one type. Grouping nodes make bulk grant/deny
practical.

**Separate `acl.xml` per app.**
Rejected. SDK-registered apps are dynamic — they do not ship Magento modules and cannot have static
`acl.xml` files. Runtime injection by the Commerce module is the only viable approach.

**Impact of not doing this.**
Apps that set `aclProtected: true` have no per-item permission control. Administrators cannot restrict
access to individual app menu entries, columns, or buttons. The User Roles screen shows nothing
app-specific.

## Unresolved questions

None.

## Future possibilities

- Phase 2–4 item types following the same generic plumbing.
- A `getGroupAclResourceId(appId, itemTypeToken)` SDK helper for checking group-level permissions.
- Tooling in `aio-commerce-lib-admin-ui` to enumerate all registered ACL ids for an app, enabling
  permission-summary UIs in App Management.
- Discovery endpoint: Commerce exposing which ACL resources are registered for each installed app, so
  App Management can display a permission summary before an admin grants access.
