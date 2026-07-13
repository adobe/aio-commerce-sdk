# Decouple Admin UI menu from the index route

- **Ticket:** [CEXT-6454](https://jira.corp.adobe.com/browse/CEXT-6454)
- **Created:** 2026-07-13
- [ ] **Implemented**

## Summary

Today an app's Admin UI menu implicitly opens whatever page sits at the index
route — the same page Experience Shell renders by default. A page forced to be
both breaks when it uses a Commerce-only API (e.g. `useCommerce`) and Experience
Shell renders it outside Commerce.

This spec frames the two candidate solutions the design discussion produced and
exists to align on which to build — and, since they largely compose, in what
combination:

- **Approach A — config `menu.path`:** the menu declares an explicit path; the
  menu iframe opens there instead of the app root, so the menu page and the
  Shell-default page can be different pages. Requires SDK **and** Commerce module
  (`adobe-commerce-backend-uix`) changes.

- **Approach B — `entry` in `createExtensionApp`:** the SDK declares the app's
  single entry point client-side; the iframe URL is unchanged. Requires no
  Commerce module changes, but requires the Commerce-only host hooks to stop
  throwing and adopt a result pattern so a single shared entry can render safely
  in both contexts.

Both approaches share one cleanup: remove the special `index: true` route variant
so every extension route uses one `{ path, element }` shape. The single-page
setup keeps working under either approach.

## Motivation

The `adminUi.menu` declaration carries no path of its own — unlike every other
`adminUi` entry (view buttons and mass actions both declare a `path`). The menu
is therefore implicitly bound to the app's index route: the page marked
`index: true` in `createExtensionApp`'s `routes` array.

Experience Shell also renders the index route by default. So a page that is
_both_ the menu target and the Shell default is forced to work in two contexts at
once. When that page uses a Commerce-only API — most notably `useCommerce` — it
throws when Experience Shell renders it outside Commerce, because the Commerce
context it depends on is not present there.

The developer has no clean way out. They cannot point the menu at one page and
let Experience Shell default to another (the menu has no path and the index route
is shared), and they cannot let a single shared page degrade gracefully (the
Commerce hooks throw rather than reporting a handleable state).

The stated business requirement is that apps built with the SDK
libraries must open in Experience Shell without breaking, with developers able to
control context-specific behavior. The two approaches below satisfy that
requirement by different means — routing separation (A) or graceful degradation
(B) — and the point of this spec is to choose between them.

**Goals**

- Let an app open its Admin UI menu without being forced to reuse the
  Experience-Shell-default page.

- Ensure an app that uses Commerce-only APIs does not break when opened in
  Experience Shell.

- Remove the `index: true` route variant in favor of a single `{ path, element }`
  shape.

- Preserve the single-page setup with a mechanical migration.

**Non-goals**

- Supporting more than one menu entry per app (the one-menu-per-app limit from
  CEXT-6315 is unchanged).

- Changing how Experience Shell selects its default page beyond it continuing to
  render the `"/"` route.

- Adding broad context-detection helpers for apps beyond the frame detection the
  SDK already exposes.

## The two approaches

### Approach A — explicit `menu.path` (routing separation)

The menu declares where it opens; the app registers a route for it. Because the
menu opens a different URL from the Shell default, the two are genuinely
different pages and a Commerce-only page never renders outside Commerce. The
Commerce host hooks keep their current throw-on-misuse behavior.

**Config:**

```ts
// app.commerce.config.ts
adminUi: {
  menu: {
    id: "approval_dashboard",
    label: "Approval Dashboard",
    description: "Review and approve purchase requests.",
    path: "/dashboard",
  },
}
```

**App:**

```jsx
// web-src/src/app.jsx
createExtensionApp({
  metadata: { extensionId: config.metadata.id },
  routes: [
    { path: "/", element: <ShellHome /> }, // Experience Shell default
    { path: "/dashboard", element: <Dashboard /> }, // menu opens here; may use useCommerce
  ],
});
```

`path` is required on `menu` **only under this approach** — it is the value the
Commerce module appends to the iframe URL. Single-page apps set `menu.path: "/"`
and register a `"/"` route.

**Trade-off:** clean page separation and, as written, no change to the hook
contract — at the cost of two-repo coordination and PHP module work. Two DX
caveats, though:

- It relies on developer discipline: a developer can still put `useCommerce` on
  the `"/"` route that Experience Shell renders, and it will still throw. The
  approach gives the structure to avoid that but does not enforce it.

- Keeping the throw is itself a DX tradeoff, not a free win. Throwing is good DX
  in the common case — the developer does not have to check for an error, and a
  misused hook fails loudly and early — but it also removes the developer's
  ability to handle the error themselves and forces the UI straight into an error
  boundary.

  Even with route separation, an app may legitimately want a Commerce
  hook to report a handleable state (e.g. render a fallback instead of an error
  page). So the throw-vs-result-pattern question at the heart of
  [Approach B](#approach-b--a-single-declared-entry-point-graceful-degradation) is
  **not** exclusive to B: it can be adopted under A too, independently of the
  routing change. This spec keeps A's hooks throwing only as the default framing,
  not as a settled requirement.

### Approach B — a single declared entry point (graceful degradation)

The iframe URL is unchanged (always the app root). The SDK declares the app's
single entry point client-side — an SPA single-entry-point model that replaces
the confusing `index: true` marker. Because the same entry renders in both
Commerce and Experience Shell, the Commerce-only host hooks must stop throwing
and instead report a handleable state, so the entry can render partial UI or a
custom message when Commerce context is absent.

**Config:** unchanged — no `menu.path`.

**Entry-point representation — a choice to make.** There are two ways to declare
the entry, and they are mutually exclusive:

- _(b1) A custom `entry` property_ on `createExtensionApp`, separate from
  `routes`. `entry` is preferred over `menu` as a name because the same entry
  serves Experience Shell, where "menu" reads wrong.

  ```jsx
  createExtensionApp({
    metadata: { extensionId: config.metadata.id },
    entry: <MainPage />, // the app's single entry point
    routes: [{ path: "/orders", element: <OrdersPage /> }], // additional routes
  });
  ```

- _(b2) A slash-only `path: "/"`_ — no new property; the root path is the entry
  by convention, the same representation Approach A uses.

  ```jsx
  createExtensionApp({
    metadata: { extensionId: config.metadata.id },
    routes: [{ path: "/", element: <MainPage /> }],
  });
  ```

`entry` and a `"/"` route are two ways to declare the same thing: the app's entry
point — the page loaded by default, which Experience Shell always renders and the
Commerce menu opens when one is configured. `entry` is not tied to having a menu;
an app with no menu still has an entry point that Experience Shell uses, so
`entry` works there just the same — it simply is not opened by Commerce. Use one
or the other. Having both present is a runtime error — it is ambiguous, and if
they resolve to different elements there is no sensible resolution — rather than
something the SDK silently resolves.

**Hook contract:** `useCommerce` (and any other host hook that currently throws
outside its context) returns a result instead of throwing. The result is a
traditional discriminated union of `data | error`, using `error` itself as the
discriminant — `data` and `error` are complementary (one is `null` exactly when
the other is not), so no separate boolean flag is needed:

```ts
type Result<T, E = Error> = { data: T; error: null } | { data: null; error: E };
```

```jsx
function MainPage() {
  const { data, error } = useCommerce(); // no throw
  if (error) {
    return <ShellFallback error={error} />; // rendered in Experience Shell
  }
  return <Dashboard host={data.commerceHost} />;
}
```

This is the familiar Go-style `if (error)` guard: the caller handles the error
branch before touching the data. Every host hook that can be used outside its
context adopts the same shape, so the contract stays uniform across the `/web`
API. Concretely, the hooks that currently throw and would move to this pattern
are `useCommerce`, `useSharedContext`, `useIms`, `useHostConnection`,
`useMassActionContext`, and `useOrderViewButtonContext`.

Handling `error` is not mandatory. A developer who does not check it simply keeps
the `data | null` union — the type still forces them to account for the possible
`null` before using the data, they just do it their own way rather than through
the `error` branch. The pattern surfaces the failure; it does not dictate how to
respond to it.

**What changes:**

- SDK only. `createExtensionApp` gains `entry`; the `/web` host hooks change from
  throw-on-misuse to a result pattern. No Commerce module changes.

**Trade-off:** no PHP work and no two-repo coordination, and it enforces the
"don't break in Shell" requirement by construction (a shared entry degrades
instead of throwing). The cost is a broader, more invasive change to the `/web`
API surface — every consumer of the affected hooks must now handle the
not-available state — and it keeps the menu and Shell default as the same page
(no page-level separation, only in-page branching).

### Shared cleanup: remove the `index: true` variant

Both approaches drop the special `index: true` route variant in favor of a single
`{ path, element }` shape — the mixed-shape routes array was called out as
confusing. The root stops being a special case and becomes just another `"/"`
path. Under Approach A the entry is expressed as `path: "/"`; under Approach B it
is either a dedicated `entry` property or the same `"/"` path — see the
[entry-point representation choice](#approach-b--a-single-declared-entry-point-graceful-degradation)
above.

## Comparison

| Dimension                    | A — `menu.path`                                                                                                      | B — `entry` + result-pattern hooks          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Menu vs Shell default        | Different pages (different URLs)                                                                                     | Same page; branches in-place                |
| Commerce module (PHP) change | Required                                                                                                             | None                                        |
| Repos to coordinate          | Two (SDK + backend-uix)                                                                                              | One (SDK)                                   |
| Hook error contract          | Unchanged by default; result pattern optional (see [DX tradeoff](#approach-a--explicit-menupath-routing-separation)) | Reworked (result pattern) — hard dependency |
| "Don't break in Shell"       | By developer discipline + structure                                                                                  | By construction                             |
| Config surface               | Required `menu.path`                                                                                                 | Unchanged                                   |
| `/web` API surface           | `routes` shape only                                                                                                  | `entry` added + hook return types changed   |

A and B are not strictly mutually exclusive — their knobs are largely orthogonal
and compose. `menu.path` sets where the Commerce menu opens, `entry` names the
app's default entry point, and the result-pattern hooks are separable from either.
An app can use all three at once:

```jsx
// Commerce menu opens a Commerce-only page; Experience Shell renders its own entry
adminUi: {
  menu: {
    /* ... */ path: "/dashboard";
  }
}

createExtensionApp({
  metadata: { extensionId: config.metadata.id },
  entry: <ShellHome />, // Experience Shell default (uses result-pattern hooks)
  routes: [{ path: "/dashboard", element: <Dashboard /> }], // Commerce menu target
});
```

The one genuine hard conflict is declaring the entry twice — an `entry` property
together with a `"/"` route — which is ambiguous and is a runtime error. So the
real binary fork is narrower than "A vs B": it is whether the menu gets its own
path (and the Commerce-module work that requires) or not. Everything else is a
question of which knobs to combine.

## Drawbacks

- **Both:** removing `index: true` changes the `createExtensionApp` shape, so
  existing apps and the scaffold examples have to migrate. This is not a break of
  a stable contract — `/web` and `adminUi` are newly introduced and still
  `@experimental`, so nothing has shipped under a stable API yet — but it is still
  a touch-every-app migration, and the surface grows the longer it waits.

- **Approach A:** a required `menu.path` means existing `adminUi.menu` configs
  must add one; two-repo coordination risks a mis-sequenced rollout opening menus
  at an unregistered path; and it does not prevent a throwing hook on the `"/"`
  route.

- **Approach B:** moving host hooks from throwing to a result pattern touches
  every hook consumer and is the larger API rework; it also keeps the menu and
  Shell default as one page, so context separation is only in-page.

## Rationale and alternatives

**Uniform `{ path, element }` shape (adopted by both).** Mixing `index: true` and
`path` in one array forces two mental models for one list and reads inconsistently
against the rest of `adminUi`. Collapsing to one shape removes the special case
entirely.

**`entry` over `menu` for the `createExtensionApp` param (Approach B).** The same
entry point also serves Experience Shell, where a `menu` name is misleading.
`entry` describes the concept — the app's entry point — without tying it to the
Commerce menu.

**Keep `index: true` and add `menu.path` alongside it.** Rejected. It leaves the
confusing mixed-shape routes array in place and keeps two ways to express the root
page.

**Impact of not doing this.** Apps that expose an Admin UI menu and also open in
Experience Shell must keep hand-rolling context detection on a single shared index
page, or avoid Commerce-only APIs there.

**Could this be done in user-space?** Approach A's menu-path half cannot: the
iframe URL is owned by the Commerce module and driven by the SDK config contract.
Approach B's degradation half is partly possible today (an app can branch on frame
detection) but not cleanly, because the hooks throw before the app can branch.

## Unresolved questions

- **The real fork: does the menu get its own path?** A (yes) means routing
  separation plus Commerce-module work — the menu opens a Commerce-specific page.
  B (no) means a single entry rendered in both contexts, made safe by the
  result-pattern hooks. These are not strictly exclusive — `menu.path`, `entry`,
  and the hook contract are largely orthogonal (see [Comparison](#comparison)) — so
  the decision is which combination to adopt, not one-of-two.

- **Entry-point representation (Approach B).** A custom `entry` property vs a
  slash-only `path: "/"` convention. The two must not coexist; configuring both —
  worse, with different elements — should be a hard error.

- **Throw vs. result pattern is cross-cutting, not B-only.** Even under Approach
  A, keeping the throw is a DX tradeoff: simpler and louder for the common case,
  but it forces an error boundary and prevents apps from handling the error
  themselves. Decide whether the hook contract change is coupled to
  [Approach B](#approach-b--a-single-declared-entry-point-graceful-degradation), or
  adopted independently regardless of the routing decision.

- **Approach A — is `menu.path` required or optional-defaulting-to `"/"`?** The
  ticket says required; optional-default would make the single-page migration
  zero-touch at the cost of an implicit default.

## Future possibilities

- With a uniform route shape, the scaffold could pre-generate a page stub per
  configured `adminUi` path, extending the CEXT-6338 scaffolding idea to menus.
