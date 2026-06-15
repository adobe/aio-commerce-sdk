# Scaffold web-src for Admin UI v2 view extensions

- **Ticket:** [CEXT-6338](https://jira.corp.adobe.com/browse/CEXT-6338)
- **Created:** 2026-06-10
- [ ] **Implemented**

## Summary

The `generate all` command for `commerce/backend-ui/2` already emits a `view` operation and
`web: "web-src"` into `ext.config.yaml` whenever the app config requires iframe-based UI —
currently view-type mass actions (CEXT-6095), the Admin UI menu (CEXT-6315), and order view buttons
(CEXT-6316). Without a corresponding `web-src/` directory, the `view` operation is non-functional:
Commerce cannot open the iframe at all, so the registered menu item, view button, or view mass
action simply does not work.

This spec adds an idempotent `generateWebSrc` function to `lib-app`'s generate layer. When invoked
— either by `generate all` or by the pre-app-build hook — it creates a minimal runnable `web-src/`
scaffold under `src/commerce-backend-ui-2/` if the directory does not yet exist. The
scaffold is deliberately thin: the Experience Cloud shell bootstrap, UIX registration, and shared
context access are encapsulated in a new `@adobe/aio-commerce-lib-admin-ui/web` entrypoint, so the
generated files are lightweight wrappers rather than full implementations.

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
- Keep SDK-managed files always up to date while preserving developer-authored files.
- Keep the scaffolded files thin by encapsulating the UIX and EC shell boilerplate in
  `@adobe/aio-commerce-lib-admin-ui/web`.

**Non-goals**

- Regenerating or merging into an existing `web-src/` after SDK updates.
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
    routes.jsx
    pages/
      main-page.jsx
    components/
```

The scaffold is split into two zones with different regeneration semantics:

- **SDK-managed**: `index.html` and `src/app.jsx` are always regenerated on every `generate all`
  and pre-app-build run. They contain no user logic — developers should not modify them.
- **User-managed**: `index.css`, `src/routes.jsx`, and `src/pages/main-page.jsx` are generated
  once and never touched again. This is where developers declare their routes, write their UI, and
  add their styles. CSS composition via `@import` is the recommended way to add additional
  stylesheets. `src/components/` is left empty for developers to add shared UI primitives.

`app.jsx` is the webpack entry point and the equivalent of `App.js` in the raw Commerce sample. It
reads `metadata.id` from `#app.commerce.config`, imports the routes from the user-managed
`routes.jsx`, and delegates all shell wiring to `createExtensionApp` from
`@adobe/aio-commerce-lib-admin-ui/web`:

```jsx
import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import routes from "./routes";
import config from "#app.commerce.config";

createExtensionApp({
  extensionId: config.metadata.id,
  routes,
});
```

`createExtensionApp` handles all the wiring that `App.js` previously owned in the raw Commerce
sample: the `HashRouter`, Spectrum 2 `Provider`, `ErrorBoundary` with a default fallback, UIX
`register()` call, and the `runtime.on('configuration')` and `runtime.on('history')` EC shell
event handlers. Route definitions live in `routes.jsx`, which is user-managed. The generated
`routes.jsx` starts with `MainPage` as the index route and is the file developers extend when adding
paths for additional mass actions:

```jsx
import { MainPage } from "./pages/main-page";
import { BulkCancelPage } from "./pages/bulk-cancel-page";
import { ArchivePage } from "./pages/archive-page";

export default [
  { index: true, element: <MainPage /> },
  { path: "bulk-cancel", element: <BulkCancelPage /> },
  { path: "archive", element: <ArchivePage /> },
];
```

Each `path` here corresponds to the hash fragment declared in `app.commerce.config.ts` — for
example `path: "#/bulk-cancel"` maps to the `"bulk-cancel"` route above. `BulkCancelPage` and
`ArchivePage` are additional user-created components.

`pages/main-page.jsx` is user-managed — generated once and the starting point for all custom UI. It
is pre-wired with `useSharedContext` so context values are immediately available:

```jsx
import { useSharedContext } from "@adobe/aio-commerce-lib-admin-ui/web";
import { View } from "@react-spectrum/s2";

export function MainPage() {
  const { extensionId, imsToken, imsOrgId } = useSharedContext();
  return <View>{/* Add your UI here */}</View>;
}
```

`index.html` is the entry point loaded by the `view` operation URL. It references `index.css`,
the user-managed global stylesheet.

On subsequent runs, `generateWebSrc` regenerates the SDK-managed files and skips `index.css`,
`routes.jsx`, and `pages/main-page.jsx` if they already exist.

## Design

### `@adobe/aio-commerce-lib-admin-ui/web`

A new `./web` entrypoint is added to `@adobe/aio-commerce-lib-admin-ui`. It exports two browser-
side utilities that encapsulate the EC shell and UIX guest boilerplate:

**`createExtensionApp({ extensionId, routes })`** — replaces the entire `index.js` +
`exc-runtime.js` + `App.js` + `ExtensionRegistration.js` quad from the raw Commerce sample. It
handles the EC runtime loading internally via `@adobe/exc-app`, bootstraps the shell with a
fallback to a mock runtime for local development, mounts a `HashRouter` with a Spectrum 2
`Provider` and a default `ErrorBoundary`, registers `runtime.on('configuration')` and
`runtime.on('history')` EC shell event handlers, and calls `register()` from `@adobe/uix-guest`
with the given `extensionId`. The `routes` array follows the React Router v6 route object format
and is rendered inside the router — the index route is typically the main page component.
Alternatively, `rootComponent` can be passed instead of `routes` for apps that manage their own
routing solution; in that case no `HashRouter` is mounted and `rootComponent` is rendered directly
inside the provider tree. `routes` and `rootComponent` are mutually exclusive: passing both is a TypeScript compile error for
TypeScript consumers, and a thrown error at runtime for JavaScript consumers.

**`useSharedContext()`** — a React hook that calls `attach()` from `@adobe/uix-guest` using the
extension ID set by `createExtensionApp` via internal context, and returns
`{ extensionId, imsToken, imsOrgId }`. `extensionId` is available synchronously; `imsToken` and
`imsOrgId` are `null` until the shared context connection is established. Must be called inside a
component tree rendered by `createExtensionApp`.

React and `@react-spectrum/s2` are declared as `peerDependencies` of `lib-admin-ui` — version
alignment matters for both (multiple React instances break hooks; Spectrum 2 components must share
a single provider tree). `@adobe/uix-guest` and `@adobe/exc-app` are regular `dependencies`:
apps never import them directly and there is no version alignment concern.

Because pnpm, yarn, and bun do not auto-install peers, `generateWebSrc` handles peer installation
explicitly: after copying the scaffold files it reads `lib-admin-ui`'s `peerDependencies`, checks
which are absent from the app's `package.json`, and installs the missing ones using the package
manager detected from the app's lock file — the same detection already used by the `init` command.
This means developers never need to think about peer installation; it happens automatically as part
of scaffolding. The entrypoint is browser-only (not suitable for server-side rendering or Node.js
usage paths) and is marked accordingly in `package.json`.

### Trigger condition

`generateWebSrc` is called when `updateExtConfig()` returns an `ExtConfig` with
`operations.view` defined. This is a direct read of the value already in memory — no additional
config parsing.

### `generateWebSrc` function

`generateWebSrc(extensionPointId)` lives in the generate layer of `lib-app` alongside
`generateActionFiles()` and `updateExtConfig()`. It applies two distinct strategies depending on
which zone each file belongs to:

**SDK-managed files** (`index.html`, `src/app.jsx`) — always written, overwriting any previous
version. These files are pure boilerplate; regenerating them keeps the scaffold in sync with the
current `lib-admin-ui/web` API without requiring developer intervention.

**User-managed files** (`index.css`, `src/routes.jsx`, `src/pages/main-page.jsx`) — written only if
the file does not already exist. Once a developer has modified these files, subsequent runs leave
them untouched.

All files are static copies from the package's template directory — no interpolation is needed
because `app.jsx` reads `metadata.id` from `#app.commerce.config` at runtime.

After copying files, `generateWebSrc` installs any missing `peerDependencies` of `lib-admin-ui`
into the app using the package manager detected from the app's lock file.

### Scaffold contents

| File                      | Zone         | Role                                                                                                             |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `index.html`              | SDK-managed  | Entry point loaded by the `view` operation URL; mounts the React app; references `index.css`                     |
| `src/app.jsx`             | SDK-managed  | Reads `metadata.id` from `#app.commerce.config`; imports routes from `routes.jsx`; calls `createExtensionApp`    |
| `index.css`               | User-managed | Global stylesheet; generated once; developers add styles directly or compose additional sheets via CSS `@import` |
| `src/routes.jsx`          | User-managed | Route definitions; generated once; developers add entries for each additional view path                          |
| `src/pages/main-page.jsx` | User-managed | Stub entry point for custom UI; pre-wired with `useSharedContext()` to access shared context values              |

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

Because `generateWebSrc` is idempotent, the hook invocation is a no-op once `web-src/` has been
created.

## Drawbacks

The user-managed zone (`pages/main-page.jsx`, `routes.jsx`, and `index.css`) is never regenerated
after initial creation. If `useSharedContext()` exposes an additional value, existing apps will not receive the
update automatically and developers must add the new value manually. Because the substance of the
scaffold lives in the library, these interface-breaking changes should be rare in practice.

SDK-managed files (`index.html` and `src/app.jsx`) are unconditionally overwritten on every
`generate all` and pre-app-build run. Moving route definitions to the user-managed `routes.jsx`
avoids the most common reason to edit `app.jsx`, but there is still no mechanism to opt out of
scaffolding entirely: manual edits to SDK-managed files are silently discarded on the next run.
Developers who need a setup that diverges from the scaffold have no supported path today. Adding an
opt-out mechanism is deferred to a future iteration when a concrete need arises.

The current design explicitly ties `web-src` to React: `createExtensionApp` mounts a `HashRouter`
with a Spectrum 2 `Provider`, `useSharedContext` is a React hook, and the scaffold ships `.jsx`
files. Apps that want to use a different framework (Vue, Svelte, vanilla JS) have no supported
path.

## Rationale and alternatives

**Why abstract into `lib-admin-ui/web` rather than generate full implementations?** If the scaffold
generated self-contained files with `@adobe/uix-guest` calls inlined, every change to the UIX or
EC shell integration pattern would require developers to manually update their generated files.
Encapsulating those concerns in the library means apps get updates at package upgrade time, not
through a regenerate flow.

**Why zone-based regeneration rather than a coarse skip-if-exists?** A single skip-if-exists guard
on the whole `web-src/` directory protects user files but also prevents the SDK from keeping its
own boilerplate current. Separating the scaffold into SDK-managed and user-managed zones makes the
contract explicit: the SDK always owns `index.html` and `src/app.jsx`, developers always own
`src/pages/main-page.jsx`. Merging generated content with developer-authored content in a
single file would require tracking which lines are generated — significant complexity with no clear
benefit, and the zone separation avoids it entirely.

**Could this be solved in user-space?** Yes — copying from the Commerce sample is the current
workaround. The SDK adds value by automating the step, using the correct `extensionId` without
manual edits, and establishing a canonical starting point that benefits from library updates.

**Why provide any routing abstraction at all — no routing?** `createExtensionApp` could accept only
a `rootComponent` and render it directly with no router mounted. This is the simplest possible
contract and is already supported via the `rootComponent` prop. It is the right choice for apps
with a single view that have no need for multiple paths. The `routes` shorthand exists because the
common case — one hash-fragment path per view mass action — is pure boilerplate with no meaningful
design decisions to make.

**Why not leave routing fully developer-managed?** Developers could wire their own router —
React Router, TanStack Router, or any other library — inside `rootComponent`, keeping the SDK out
of routing entirely. This gives maximum flexibility and no opinion on router choice. The tradeoff
is that every app reimplements the same `HashRouter` + provider setup for what is ultimately the
same structural requirement. The `routes` prop is an opt-in convenience, not a constraint: apps
that prefer their own router pass `rootComponent` instead and the SDK steps aside.

**Why not file-based routing?** A file-based convention (one file per route under `src/pages/`,
auto-discovered at build time) would eliminate manual `routes.jsx` maintenance and is a viable
alternative the SDK could implement. The reason it was set aside is that it couples routing
structure to file system layout, forcing a specific code organization on developers who may
disagree with that convention or need to structure their project differently. The explicit
`routes.jsx` file keeps routing declarative without dictating where components live.

## Unresolved questions

- The exact API shape of `createExtensionApp` and `useSharedContext` should be finalized before
  implementation of `lib-admin-ui/web` begins — specifically whether `mainPage` is a component
  reference or a render function, and what additional shared context values (beyond `imsToken` and
  `imsOrgId`) `useSharedContext()` should expose.

## Future possibilities

- `createExtensionApp` could accept an `onReady` callback or expose routing helpers so developers
  can register multiple hash routes without wiring `HashRouter` manually.
- As more `backend-ui/2` features use the shared context, `useSharedContext` could be extended to
  return additional context values (e.g., `locale`, `imsProfile`) with typed access.
- An opt-out mechanism for SDK-managed file generation could be added when a concrete need arises
  — for example, a flag in `app.commerce.config.ts` that suppresses `generateWebSrc` for apps
  that manage their own `web-src/` setup.
