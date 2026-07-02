# Scaffold web-src for Admin UI v2 view extensions

- **Ticket:** [CEXT-6338](https://jira.corp.adobe.com/browse/CEXT-6338)
- **Created:** 2026-06-10
- [ ] **Implemented**

## Summary

The `generate all` command for `commerce/backend-ui/2` already emits a `view` operation into
`ext.config.yaml` whenever the app config requires iframe-based UI — currently view-type mass
actions (CEXT-6095), the Admin UI menu (CEXT-6315), and order view buttons (CEXT-6316). Without a
corresponding `web-src/` directory, the `view` operation is non-functional: Commerce cannot open
the iframe at all, so the registered menu item, view button, or view mass action simply does not
work.

This spec adds an idempotent `generateWebSrc` function to `lib-app`'s generate layer. When invoked
— either by `generate all` or by the pre-app-build hook — it generates a minimal runnable `web-src/`
scaffold under `src/commerce-backend-ui-2/`, but only when the resolved `view` entrypoint does not
already exist on disk. Generation is non-destructive: the SDK never overwrites a file a developer
already has. The scaffold is deliberately thin: the Experience Cloud shell bootstrap, UIX
registration, and shared context access are encapsulated in a new
`@adobe/aio-commerce-lib-admin-ui/web` entrypoint, so the generated files are lightweight wrappers
rather than full implementations. The entrypoint provides React with Spectrum 2 building blocks; it
does not support other frameworks, but developers who bring their own `web-src/` are left untouched.

## Motivation

App Builder's `view` operation requires a web entry point to function. Commerce resolves the URL
registered under that operation to `index.html` served from `web-src/`. Without `web-src/`, the
`view` operation is inoperable — Commerce cannot load the iframe, so any feature that depends on it
(menu items, view buttons, view mass actions) is completely non-functional from the moment the
ext.config entry is written.

The SDK is the right place to provide this scaffold: it is the component that knows a `view`
operation is needed (it writes it), and it already performs analogous first-time generation for
runtime action templates and the app-config module. Developers currently work around the gap by
manually copying files from the
[Commerce samples repository](https://github.com/adobe/adobe-commerce-samples/tree/main/admin-ui-sdk/menu/custom-menu/src/commerce-backend-ui-1/web-src),
which is undiscoverable and inconsistent with how the rest of the SDK onboards developers.

Generating the scaffold with all UIX and EC shell integration wired inline would also create a
different problem: whenever `@adobe/uix-guest`, `@adobe/exc-app`, or the shell bootstrap pattern
changes, every existing app would need to manually update its generated files. Abstracting those
concerns into `lib-admin-ui/web` means the library absorbs the churn and apps get updates
automatically when they upgrade the SDK package.

This also mirrors the dependency management model the SDK already applies to generated runtime
actions (`lib-app`) and business configuration (`lib-config`): the SDK pins the required library
versions, and generated apps declare the SDK as their dependency rather than the underlying
libraries directly. As a result, dependency updates — including security fixes — flow to all apps
through a single SDK version bump, and app developers never need to audit or update these
transitive dependencies themselves.

**Goals**

- Generate a runnable `web-src/` scaffold the first time a `view` operation is written.
- Use `metadata.id` from the app manifest as the extension ID so the scaffold is correct for the
  app without any manual edits.
- Never overwrite existing files: generate only when the resolved `view` entrypoint is absent, so
  developers can take full ownership of their `web-src/`.
- Keep the scaffolded files thin by encapsulating the UIX and EC shell boilerplate in
  `@adobe/aio-commerce-lib-admin-ui/web`.

**Non-goals**

- Regenerating, merging into, or updating an existing `web-src/` after SDK updates.
- Built-in support for non-React frameworks; the scaffold and library are React plus Spectrum 2.
- Scaffolding UI logic beyond what is needed to register the extension and provide a starting point.
- Scaffolding web source for extension points other than `commerce/backend-ui/2`.

## Developer experience

A developer configures an Admin UI v2 feature that requires an iframe:

```ts
// app.commerce.config.ts
export default defineConfig({
  metadata: {
    id: "my-order-extension",
    // ...
  },
  adminUi: {
    order: {
      massActions: [
        {
          id: "bulk-cancel",
          label: "Cancel orders",
          type: "view",
          path: "#/bulk-cancel",
        },
      ],
    },
  },
});
```

Running `generate all` scaffolds the `web-src/` alongside the ext.config update:

```
✔ Updating ext.config.yaml for commerce/backend-ui/2...
✔ Scaffolding web-src for commerce/backend-ui/2...
```

The generated tree under `src/commerce-backend-ui-2/`:

```
web-src/
  index.html
  index.css
  src/
    app.jsx
    pages/
      main-page.jsx
    components/
```

Every generated file is owned by the developer from the moment it lands. The SDK generates the
scaffold once — when the resolved `view` entrypoint does not yet exist — and never overwrites or
regenerates anything afterwards. Developers are free to edit any file, including `app.jsx`;
`src/components/` starts empty as the conventional home for shared UI primitives.

`app.jsx` is the Parcel entry point and the equivalent of `App.js` in the raw Commerce sample. It
reads `metadata.id` from `#app.commerce.config`, imports `MainPage`, and delegates all shell wiring
to `createExtensionApp` from `@adobe/aio-commerce-lib-admin-ui/web`:

```jsx
import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import { MainPage } from "./pages/main-page";
import config from "#app.commerce.config";

createExtensionApp({
  metadata: { extensionId: config.metadata.id },
  routes: [{ index: true, element: <MainPage /> }],
});
```

`createExtensionApp` handles all the wiring that `App.js` previously owned in the raw Commerce
sample: a hash-based router, the Spectrum 2 `Provider`, a default error boundary, the UIX guest
registration, and the Experience Cloud shell runtime wiring (configuration and navigation events).
The generated `routes` array starts with `MainPage` as the index route; developers extend it inline
when adding paths for additional mass actions:

```jsx
import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import { MainPage } from "./pages/main-page";
import { BulkCancelPage } from "./pages/bulk-cancel-page";
import { ArchivePage } from "./pages/archive-page";
import config from "#app.commerce.config";

createExtensionApp({
  metadata: { extensionId: config.metadata.id },
  routes: [
    { index: true, element: <MainPage /> },
    { path: "bulk-cancel", element: <BulkCancelPage /> },
    { path: "archive", element: <ArchivePage /> },
  ],
});
```

Each `path` here corresponds to the hash fragment declared in `app.commerce.config.ts` — for
example `path: "#/bulk-cancel"` maps to the `"bulk-cancel"` route above. `BulkCancelPage` and
`ArchivePage` are additional user-created components.

`pages/main-page.jsx` is the starting point for all custom UI. It is pre-wired with `useIms` so the
host-provided IMS credentials are available:

```jsx
import { useIms } from "@adobe/aio-commerce-lib-admin-ui/web";

export function MainPage() {
  const { imsToken, imsOrgId } = useIms();
  return <main>{/* Add your UI here */}</main>;
}
```

`index.html` is the entry point loaded by the `view` operation URL. It references `index.css`,
the global stylesheet.

On subsequent runs, `generateWebSrc` finds the resolved `view` entrypoint already present and does
nothing.

## Design

### `@adobe/aio-commerce-lib-admin-ui/web`

A new `./web` entrypoint is added to `@adobe/aio-commerce-lib-admin-ui`. It exports browser-side
utilities that encapsulate the EC shell and UIX guest boilerplate:

**`createExtensionApp({ metadata, routes, root? })`** — replaces the entire `index.js` +
`exc-runtime.js` + `App.js` + `ExtensionRegistration.js` quad from the raw Commerce sample. It
handles the EC runtime loading internally via `@adobe/exc-app`, bootstraps the shell with a
fallback to a mock runtime for local development, mounts a hash-based router with a Spectrum 2
`Provider` and a default error boundary, wires the Experience Cloud shell runtime (configuration and
navigation events), and calls `register()` from `@adobe/uix-guest` with the extension ID. The
`metadata` object carries the `extensionId`; the optional `root` overrides the mount element, which
defaults to `#root`. The `routes` array follows a standard route object
format — an index route plus optional path routes — and is rendered inside the router, with the
index route typically being the main page component. Because the scaffold is fully developer-owned,
apps that want a different routing setup edit `app.jsx` directly: drop the `routes` array, mount
their own router, or render a single root component.

The entrypoint also exposes React hooks for reading host-provided context inside a rendered route.
**`useIms()`** returns the IMS credentials `{ imsToken, imsOrgId }`, available in both the Commerce
Admin and the Experience Cloud shell (it throws when the app runs standalone, outside any host).
**`useSharedContext()`** returns the Commerce shared context (`{ extensionId, sharedContext, host }`)
provided by the UIX host (it throws when used outside the Commerce Admin). While the connection to
the host is still being established, `createExtensionApp` suspends the rendered route via `Suspense`
instead of surfacing a connecting state through the hook, so consumers only ever observe a resolved
context. **`useCommerce()`** returns `{ commerceHost }`, the domain of the Commerce Admin the
extension is embedded in, resolved once over the guest connection and cached per extension
(available on every Commerce extension point; it throws when used outside the Commerce Admin, same
as `useSharedContext()`). Extension-point-specific helpers — `useMassActionContext`,
`useOrderViewButtonContext`, and `useHostConnection` — build on these to expose the selected row
IDs, the order ID, and host-frame actions (closing the iframe). All hooks must be called inside a
component tree rendered by `createExtensionApp`.

The `/web` entrypoint requires React (`react`, `react-dom`) and `@react-spectrum/s2` at runtime.
These are declared as **optional** `peerDependencies` of `lib-admin-ui`: the package exposes several
entrypoints and most consumers never touch `/web`, so marking the peers optional expresses the
version expectation for `/web` consumers without imposing the requirement (and the peer warnings
that come with it) on consumers of other entrypoints. The SDK still pins the exact versions the
`/web` entrypoint expects and installs them into the app during scaffolding — the same approach the
`init` workflow already uses for its pinned dependencies. `@adobe/uix-guest` and `@adobe/exc-app`
are regular `dependencies` of `lib-admin-ui`: apps never import them directly.

After copying the scaffold files, `generateWebSrc` installs the pinned `/web` dependencies (React
and `@react-spectrum/s2`) into the app: it checks which are absent from the app's `package.json`
and adds them at the SDK-pinned versions, using the package manager detected from the app's lock
file — the same detection already used by the `init` command. Pinning rather than relying on peer
resolution keeps these versions aligned across apps (multiple React instances break hooks; Spectrum
2 components must share a single provider tree) without imposing the dependency on consumers of
other entrypoints. The entrypoint is browser-only (not suitable for server-side rendering or
Node.js usage paths) and is marked accordingly in `package.json`.

### Trigger condition

`generateWebSrc` is called when `updateExtConfig()` returns an `ExtConfig` with `operations.view`
defined. As part of writing that operation, the SDK also writes the `web` key explicitly into
`ext.config.yaml` — until now it relied on App Builder's implicit `web-src` default. Making the
value explicit means `generateWebSrc` can resolve the scaffold location deterministically from the
config rather than assuming the default.

### `generateWebSrc` function

`generateWebSrc(extensionPointId)` lives in the generate layer of `lib-app` alongside
`generateActionFiles()` and `updateExtConfig()`. It first resolves the `view` entrypoint by
combining the `web` key value with the HTML entrypoint declared by the `view` operation — for
example `web-src` + `index.html` resolves to `web-src/index.html`. This resolved path is the
single source of truth for whether scaffolding is needed:

- If the resolved entrypoint **already exists**, `generateWebSrc` is a complete no-op. Nothing is
  written, nothing is overwritten.
- If it **does not exist**, the full scaffold is generated.

This existence check is both the idempotency mechanism and the opt-out: a developer who provides
their own entrypoint — a custom React setup, a different framework, or a hand-written `web-src/` —
is detected and left entirely untouched, because the SDK only generates when the entrypoint is
absent and never overwrites.

All files are static copies from the package's template directory — no interpolation is needed
because `app.jsx` reads `metadata.id` from `#app.commerce.config` at runtime.

After copying files, `generateWebSrc` installs any missing pinned `/web` dependencies (React and
`@react-spectrum/s2`) into the app at the SDK-pinned versions, using the package manager detected
from the app's lock file.

### Scaffold contents

| File                      | Role                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `index.html`              | Entry point loaded by the `view` operation URL; mounts the React app; references `index.css`             |
| `src/app.jsx`             | Reads `metadata.id` from `#app.commerce.config`; declares the `routes` array; calls `createExtensionApp` |
| `index.css`               | Global stylesheet; developers add styles directly or compose additional sheets via CSS `@import`         |
| `src/pages/main-page.jsx` | Stub entry point for custom UI; pre-wired with `useIms()` to access the host-provided IMS credentials    |

### `generate all` integration

`generateWebSrc` is an internal function with no user-facing subcommand. It is called from
`generate all` as part of the `backend-ui/2` generation sequence — the same sequence that calls
`updateExtConfig`. Concretely, after `updateExtConfig` returns:

```ts
if (hasAdminUi(appManifest)) {
  const extConfig = await updateExtConfig(
    appManifest,
    BACKEND_UI_V2_EXTENSION_POINT_ID,
  );
  if (extConfig.operations?.view) {
    await generateWebSrc(BACKEND_UI_V2_EXTENSION_POINT_ID);
  }
}
```

Because each `type: "view"` mass action already declares a `path` in `app.commerce.config.ts`,
`generateWebSrc` could also generate a page stub for each unique path and pre-populate the
`routes` array in `app.jsx` accordingly — eliminating the need for manual route wiring when
multiple view mass actions are configured.

### Pre-app-build hook

The pre-app-build hook for `backend-ui/2` leverages the same `generateWebSrc` function to guarantee
consistency on every build — following the same pattern as `extensibility/1` and `configuration/1`
which re-run their generate steps on every hook execution:

```ts
if (hasAdminUi(appManifest)) {
  const extConfig = await updateExtConfig(
    appManifest,
    BACKEND_UI_V2_EXTENSION_POINT_ID,
  );
  if (extConfig.operations?.view) {
    await generateWebSrc(BACKEND_UI_V2_EXTENSION_POINT_ID);
  }
}
```

Because `generateWebSrc` is idempotent, the hook invocation is a no-op once the resolved `view`
entrypoint exists.

## Drawbacks

Nothing is ever regenerated after the initial scaffold. The generated wrapper files (`app.jsx`,
`index.html`) are frozen at the template version that produced them, so improvements or fixes to
the template itself do not reach existing apps — only changes that live inside `lib-admin-ui/web`
propagate through a package upgrade. Because the substance of the scaffold lives in the library,
the frozen wrappers are intentionally thin and such template-level changes should be rare.

The current design ties the scaffold to React: `createExtensionApp` mounts a hash-based router with
a Spectrum 2 `Provider`, the context hooks are React hooks, and the scaffold ships `.jsx` files.
Spectrum 2 is a deliberate requirement — Admin UI extensions should look consistent across vendors —
so there is no built-in support for other frameworks. The escape hatch is all-or-nothing: a
developer who wants a different framework (or any setup the scaffold does not provide) must own the
entire `view` entrypoint themselves, forgoing the library's shell and shared-context helpers
entirely. There is no partial path that keeps the EC shell wiring while swapping the UI layer.

## Rationale and alternatives

**Why abstract into `lib-admin-ui/web` rather than generate full implementations?** If the scaffold
generated self-contained files with `@adobe/uix-guest` calls inlined, every change to the UIX or
EC shell integration pattern would require developers to manually update their generated files.
Encapsulating those concerns in the library means apps get updates at package upgrade time, not
through a regenerate flow.

**Why generate-once rather than zone-based regeneration?** An earlier design split the scaffold
into SDK-managed files (always regenerated) and user-managed files (generated once) so the SDK
could keep its own boilerplate current. That was dropped for two reasons. First, regenerating files
means silently discarding developer edits to anything the SDK claims to own, which has no opt-out
and surprises developers. Second, the boilerplate the SDK would want to keep current already lives
in `lib-admin-ui/web`, not in the generated files — the wrappers are thin enough that there is
little to keep in sync. A single existence check keyed off the resolved `view` entrypoint is
simpler, never destroys work, and doubles as the opt-out for developers who bring their own setup.

**Could this be solved in user-space?** Yes — copying from the Commerce sample is the current
workaround. The SDK adds value by automating the step, using the correct `extensionId` without
manual edits, and establishing a canonical starting point that benefits from library updates.

**Why a `routes` prop rather than a dedicated routing API?** The `routes` array is just a
convenience for the common case — one hash-fragment path per view mass action, which is pure
boilerplate with no meaningful design decisions. It is not a constraint. Because the scaffold is
fully developer-owned, apps that want something else edit `app.jsx` directly: render a single root
component with no router, or wire their own router (React Router, TanStack Router, or anything else)
around the provider tree. The SDK does not need a separate prop or contract for these cases — owning
the file already grants full freedom, so no additional API surface is warranted.

**Why not file-based routing?** A file-based convention (one file per route under `src/pages/`,
auto-discovered at build time) would eliminate manual route wiring and is a viable alternative the
SDK could implement. The reason it was set aside is that it couples routing structure to file
system layout, forcing a specific code organization on developers who may disagree with that
convention or need to structure their project differently. The inline `routes` array in `app.jsx`
keeps routing declarative without dictating where components live.

## Future possibilities

- `createExtensionApp` could accept an `onReady` callback or expose routing helpers so developers
  can register multiple hash routes without wiring a router manually.
- As more `backend-ui/2` features use the shared context, the context hooks could be extended to
  return additional context values (e.g., `locale`, `imsProfile`) with typed access.
- A partial escape hatch could let developers keep the library's EC shell wiring and shared-context
  helpers while supplying their own UI layer, rather than the current all-or-nothing choice between
  the full React scaffold and owning the entire `view` entrypoint.
