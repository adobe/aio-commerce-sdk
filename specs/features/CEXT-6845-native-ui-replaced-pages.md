# Native UI page replacement for Admin UI

- **Ticket:** [CEXT-6845](https://jira.corp.adobe.com/browse/CEXT-6845)
- **Created:** 2026-10-16
- [x] **Implemented**

## Summary

Add a new Admin UI SDK extension point, `adminUi.nativeUi.replacedPages`, that
lets an app replace a native Commerce Admin form with a page served from the
app's `web-src`. The first release supports a single target, `order.create`, and
the replacement page can read the optional `customerId` and `storeId` from the
Commerce shared context through a new `useNativeUiContext()` hook.

## Motivation

Apps can extend the Commerce Admin with menus, banners, grids, and custom pages,
but cannot take over a native form. Developers who need a bespoke order
creation experience (custom pricing, quoting, B2B flows) have to hand-write the
registration payload for the Admin UI SDK and wire the web view themselves,
outside the SDK's config schema, validation, and lifecycle management.

Goals:

- Declare form replacements in the app config like any other Admin UI extension
  point, with validation and generated registration.
- Restrict `target` to the forms Commerce allows replacing, failing early on
  anything else.
- Give the replacement page typed access to the context the host provides.
- Document the constraints that cannot be validated locally.

Non-goals:

- Targets other than `order.create` (see Future possibilities).
- Detecting, at install time, that another app already replaces the same
  target.
- Generating the replacement page itself; the app owns the route at `path`.

## Developer experience

Declare the replacement in `app.commerce.config`:

```ts
adminUi: {
  nativeUi: {
    replacedPages: [
      {
        target: "order.create",
        path: "#/create-order",
        title: "Create Order (App)",
        sandboxPermissions: ["allow-modals"],
      },
    ],
  },
}
```

Render a route matching `path` in the app's `web-src`, and read the host
context with the hook from `@adobe/aio-commerce-lib-admin-ui/web`:

```tsx
import { useNativeUiContext } from "@adobe/aio-commerce-lib-admin-ui/web";

function CreateOrder() {
  const { data, error } = useNativeUiContext();
  if (error) {
    return <ErrorState error={error} />;
  }

  return <OrderForm customerId={data.customerId} storeId={data.storeId} />;
}
```

`customerId` and `storeId` are optional and may be absent (for example, when
creating an order without a preselected customer). IDs are preserved as sent,
either strings or numbers.

Configuring an unsupported target fails validation with the list of allowed
values. Declaring the same target twice in one app also fails.

Two apps replacing the same target cannot be installed on the same Commerce
instance at the same time. This is documented in the usage guide and the
Admin UI skill.

## Design

### lib-app

- The Admin UI config schema gains `nativeUi.replacedPages`, an array of
  `{ target, path, title, sandboxPermissions? }`.
- `target` is validated against an allowlist, currently `["order.create"]`.
  `sandboxPermissions` reuses the existing sandbox permission validation.
  Duplicate targets within one config are rejected.
- Configuring at least one replacement enables the existing `view` operation and
  `web-src` generation, the same way other iframe-based extension points do. No
  new generated code is needed: the app's own route renders the page.
- The Admin UI management plan enumerates each replacement as a component of
  kind `replacedPages`, identified by its target, so register, refresh, and
  uninstall treat them like other registered components.
- `NativeUiReplacedPage` is exported from the config entrypoint.

### lib-admin-ui

- `useNativeUiContext()` reads `customerId` and `storeId` from the live Commerce
  shared context and returns a `Result<NativeUiContext>`.
- Absent or `null` values are omitted from `data`. Values that are neither a
  string nor a finite number produce an error result, as does calling the hook
  outside a Commerce host, consistent with the other Commerce hooks.

### Edge cases

- Cross-app exclusivity cannot be validated by the SDK; the host decides
  behavior when two apps register the same target, so this is documentation only.
- The `path` must match a route in the app; the SDK does not verify it.

## Drawbacks

- Replacing a native form puts the burden of feature parity on the app.
- The allowlist must be kept in sync with the targets Commerce supports.
- The single-owner limitation per target is easy to hit and only discoverable
  through documentation.

## Rationale and alternatives

- **Generate the replacement page in lib-app:** rejected. The replacement is a
  full app view, so generating a stub adds no value over the app owning the
  route.
- **Hand-written registration outside the SDK:** possible in user-space, but
  loses schema validation, allowlist checks, and lifecycle management.
- **Ship all nine candidate targets now:** rejected in favor of a narrow first
  release, `order.create`, widened later by extending the allowlist.
- **Dedicated hook vs. generic `useSharedContext`:** a typed hook hides the host
  context shape and validates values for the common case.

## Unresolved questions

- Whether Commerce will expose a way to detect replacement conflicts at install
  time.
- Which additional targets will be supported and their shared context.

## Future possibilities

- Extend the allowlist to `invoice.create`, `rma.create`, `shipment.create`,
  `creditmemo.create`, `product.edit`, `product.create`, `customer.create`, and
  `customer.edit`, with per-target context helpers.
- Install-time conflict detection across apps.
