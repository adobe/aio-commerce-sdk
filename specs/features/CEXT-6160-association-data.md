# Association Data

- **Ticket:** [CEXT-6160](https://jira.corp.adobe.com/browse/CEXT-6160)
- **Created:** 2026-05-21
- [ ] **Implemented**

## Summary

Store the Commerce instance details, Base URL and deployment type, when an app is associated
with a Commerce instance, and expose two typed async helpers: a low-level one that returns the raw instance data, and a higher-level one that returns a ready-to-use `AdobeCommerceHttpClient`, so that any runtime action can call the Commerce API without custom storage setup or client construction boilerplate.

## Motivation

Apps built on App Builder frequently need to call the Commerce API from their runtime actions.
To do so, they need the Base URL of the Commerce instance they are associated with and the
deployment type (PaaS or SaaS). Today each app reimplements this independently, typically by storing the Base URL during a custom installation step.

This pattern has two problems:

1. **Duplication.** Every app that needs to call the Commerce API writes the same storage and
   retrieval logic.
2. **Wrong lifecycle.** Storing config during installation does not keep it in sync with the
   association state. If the app is re-associated with a different instance, or unassociated, the stored config is not updated or cleared.

The SDK already receives `commerceBaseUrl` and `commerceEnv` at every association and
unassociation event. The missing piece is a standard persistence mechanism tied to the association lifecycle and typed helpers for runtime actions to consume it.

**Goals:**

- Store the Commerce Base URL and deployment type when an app is associated with an instance.
- Clear the stored data when the app is unassociated.
- Expose typed async helpers that any runtime action can use to retrieve the data and construct a ready-to-use Commerce HTTP client.
- Work for all app types, including those without a custom installation flow.

**Non-goals:**

- Storing any data beyond Base URL and deployment type in this iteration.
- Changing the existing `AIO_COMMERCE_API_BASE_URL` and `AIO_COMMERCE_API_FLAVOR`
  deployment-time parameters set in `actions.config.yaml`.
- Providing any mechanism for apps to override or augment the stored data.

## Developer experience

After this feature ships, any runtime action can call the Commerce API without custom storage
setup or client construction boilerplate.

**Primary pattern — get a ready-to-use client:**

```ts
import { getCommerceClient } from "@adobe/aio-commerce-lib-app";
import { resolveAuthParams } from "@adobe/aio-commerce-lib-auth";

export async function main(params) {
  const client = await getCommerceClient(resolveAuthParams(params));
  const products = await client.get("rest/V1/products").json();
}
```

**Low-level pattern — get the raw instance data:**

```ts
import { getCommerceInstance } from "@adobe/aio-commerce-lib-app";

export async function main() {
  const instance = await getCommerceInstance();

  // instance.baseUrl — e.g. "https://my-store.example.com"
  // instance.env     — "saas" | "paas"
}
```

No custom storage setup is required. The SDK manages the data automatically during the
association lifecycle. Both helpers work from any runtime action regardless of which OpenWhisk
package the action belongs to.

**If the app is not associated**, both helpers throw an `AppNotAssociatedError`. This applies to apps that have never been associated, were unassociated, or were associated by an older SDK that didn't store this data. Re-associating the app resolves the error. Apps that need to handle this case gracefully should wrap the call in a `try/catch`.

**Available fields** on the `AssociatedCommerceInstance` object:

| Field     | Type               | Description                              |
| --------- | ------------------ | ---------------------------------------- |
| `baseUrl` | `string`           | Commerce API base URL                    |
| `env`     | `"saas" \| "paas"` | Deployment type of the Commerce instance |

## Design

### Storage

The association data is stored using the infrastructure already established in
**`aio-commerce-lib-config`** — specifically, the shared `getSharedState()` and
`getSharedFiles()` utilities from `aio-commerce-lib-config/source/utils/repository.ts`.
`lib-config` uses a two-layer storage pattern: `lib-files` for persistent storage (source of
truth, no TTL) and `lib-state` as a performance cache (with TTL). When a cached value
expires, `lib-config` falls back to `lib-files` and re-caches automatically — so the data
is not lost when the cache entry expires.

Generic `getSystemConfigByKey` / `setSystemConfigByKey` primitives are added to
`aio-commerce-lib-config` for any SDK-managed system data. Rather than reimplementing the
two-layer cache, they reuse `configuration-repository`'s `loadConfig` / `persistConfig` /
`deleteConfig` parameterized by a separate `system.*` storage namespace, and are exported
from the package root (no dedicated subpath). They store under `system.{key}` keys (e.g.
`system.association`, future `system.events`) and `system/{key}.json` files, distinct from
the `configuration.{scopeCode}` keys / `scope/` files used by Business Configuration. The
`system.*` namespace keeps SDK-managed config cleanly separated from app-defined
`configuration.*` keys. The primitives are fully domain-agnostic — they operate purely on
opaque keys and values; domain-aware logic that uses them lives in `aio-commerce-lib-app`.

System config does not participate in the Commerce scope tree — `getSystemConfigByKey`
performs a direct key lookup with no inheritance or fallback chain. The `system.*` and
`configuration.*` namespaces are parallel, not nested.

This has two important properties for this use case:

- **Package-agnostic.** The shared storage is accessible from all actions within the same
  App Builder application, regardless of which OpenWhisk package they belong to.
- **No parameter drilling.** The helper reads directly from storage. Callers do not need to
  pass the data through every layer of the call stack.

The storage uses a two-layered design:

**`aio-commerce-lib-config`** exposes generic, domain-agnostic primitives — just key-value
access for any SDK-managed system config, with no knowledge of what's being stored. Setting
the value to `null` or `undefined` clears the entry, so there is no separate delete
operation:

```ts
// aio-commerce-lib-config (generic primitives, exported from the package root)
setSystemConfigByKey(key: string, value: unknown | null): Promise<void>
getSystemConfigByKey<T>(key: string): Promise<T | null>
```

**`aio-commerce-lib-app`** exposes typed, domain-aware wrappers on top of those primitives —
they encode the `system.association` key and the `AssociatedCommerceInstance` type so
runtime actions get a strongly-typed API:

```ts
// aio-commerce-lib-app (association module)
setAssociationData(data: AssociatedCommerceInstance): Promise<void>
getAssociationData(): Promise<AssociatedCommerceInstance | null>
clearAssociationData(): Promise<void> // calls setSystemConfigByKey("system.association", null)
```

These typed helpers are internal — used by the `association` runtime action handlers and by
the public-facing helpers. The public exports developers use are `getCommerceInstance` and
`getCommerceClient`, which throw `AppNotAssociatedError` instead of returning null.

The stored type is:

```ts
type AssociatedCommerceInstance = {
  baseUrl: string;
  env: "saas" | "paas";
};
```

The shape is designed to extend future fields (e.g. `projectId`, `workspaceId`) can be
added without a breaking change.

### New `association` runtime action

A standalone `association` runtime action is added to `aio-commerce-lib-app`. It is always
deployed alongside `app-config` — not gated on any feature, so all app types have a
reachable endpoint regardless of which features they use.

The action is protected with `require-adobe-auth: true`, the same as all other actions in
`aio-commerce-lib-app`. Only requests carrying a valid Adobe IMS token can call it, preventing
unauthorised writes or deletions of the stored association data.

**`POST /`** — Store association data

Request body:

```ts
{
  commerceBaseUrl: string;
  commerceEnv: "saas" | "paas";
}
```

The handler validates the body and calls `setAssociationData` from the new
`aio-commerce-lib-app` association module. The operation is idempotent — re-associating
with a different instance overwrites the previous values.

Response: `200 OK`.

**`DELETE /`** — Clear association data

Calls `clearAssociationData` from the `aio-commerce-lib-app` association module.

Response: `204 No Content`.

Both routes use the `HttpActionRouter` with the `logger` middleware, consistent with the
patterns used across other runtime actions in `aio-commerce-lib-app`.

### New `getCommerceInstance` helper

A new export is added to the root entrypoint of `@adobe/aio-commerce-lib-app`:

```ts
/**
 * Returns the Commerce instance this app is currently associated with.
 *
 * @throws {AppNotAssociatedError} If the app is not associated, was unassociated,
 *   or was associated by an older SDK that didn't store this data.
 */
export async function getCommerceInstance(): Promise<AssociatedCommerceInstance>;
```

The helper takes no arguments — the instance details come entirely from storage. Internally
it calls `getAssociationData` from the `aio-commerce-lib-app` association module, which in
turn calls the generic `getSystemConfigByKey("system.association")` from
`aio-commerce-lib-config`. The function is async because the underlying storage read
(lib-state cache with lib-files fallback) is a network call.

### New `getCommerceClient` helper

A higher-level export from `@adobe/aio-commerce-lib-app` that builds on
`getCommerceInstance` and returns a ready-to-use `AdobeCommerceHttpClient` from
`@adobe/aio-commerce-lib-api`:

```ts
/**
 * Returns an initialised AdobeCommerceHttpClient for the Commerce instance this app
 * is currently associated with.
 *
 * @param auth - Resolved Commerce auth credentials.
 * @throws {AppNotAssociatedError} If the app is not associated, was unassociated,
 *   or was associated by an older SDK that didn't store this data.
 */
export async function getCommerceClient(
  auth: CommerceHttpClientParams["auth"],
): Promise<AdobeCommerceHttpClient>;
```

The base URL and flavor come from the stored association data (`getCommerceInstance`); only
the auth credentials are supplied by the caller, already resolved. Auth is resolved outside
the helper with `resolveAuthParams` from `@adobe/aio-commerce-lib-auth`, keeping
`getCommerceClient` composable and single-purpose — it builds the client for the associated
instance and nothing else. If `getCommerceInstance` throws, the error propagates to the
caller.

```ts
import { getCommerceClient } from "@adobe/aio-commerce-lib-app";
import { resolveAuthParams } from "@adobe/aio-commerce-lib-auth";

const client = await getCommerceClient(resolveAuthParams(params));
```

This eliminates the repeated boilerplate of combining stored instance details with the
client config to construct the client — a pattern every action that calls Commerce would
otherwise duplicate.

### Client integration

Any client that manages the app association lifecycle is responsible for calling `POST /`
when the app is associated and `DELETE /` when the app is unassociated. The endpoint URL is
discoverable from the app's extension points metadata, registered in `workerProcess`
alongside the existing `app-config` and `installation` hrefs.

**On association** — the client calls `POST /` with the Commerce instance details first,
and only registers the app with the Extension Manager if that call succeeds. This way, the
app is never marked as associated unless the Commerce configuration was saved, and no
rollback is needed.

For older SDK versions where the `/association` endpoint isn't registered in the app's
extension points metadata, the client should skip the `POST /` call and proceed with just
the Extension Manager registration.

**On unassociation** — after unassociation completes, the client calls `DELETE /` to remove
the stored data. This step is best-effort — a failure does not block the unassociation.

### Edge cases

- **Apps associated before this feature.** No stored data exists; `getCommerceInstance`
  throws `AppNotAssociatedError`. Re-associating the app resolves it.
- **Association endpoint unreachable.** If the runtime is not deployed or returns an unexpected
  error, the association fails. The developer can retry once the endpoint is reachable.
- **Concurrent associations.** The last write wins. No conflict detection is required.

## Drawbacks

- Adds a new runtime action to every app.
- `getCommerceInstance` is async. Callers must await it, unlike a direct `params` read.
- Introduces a `aio-commerce-lib-config` network call on every action invocation that calls
  the helper.
- Association fails entirely if the config storage endpoint is unreachable. A transient
  failure blocks the whole association flow, requiring the developer to retry.

## Rationale and alternatives

**Why `aio-commerce-lib-config` infrastructure rather than OpenWhisk package parameters?**
OpenWhisk package parameters are scoped to a single package. Writing params to the
`app-management` package makes them available only to `app-management` actions. Developer
runtime actions in other packages never receive them, making the feature ineffective for
the primary use case. `aio-commerce-lib-config`'s shared storage (lib-files for persistence

- lib-state as a cache) is accessible to all actions within the same application regardless
  of package boundaries, and gives us persistence without expiry as a side effect.

**Why generic `getSystemConfigByKey` / `setSystemConfigByKey` primitives rather than using `setConfiguration` directly?**
The existing `setConfiguration`/`getConfiguration` API in `aio-commerce-lib-config` is
designed for Business Configuration — scope-tree based values keyed by Commerce scope codes
with inheritance. The data we want to store is app-level metadata, not scope-specific, and
doesn't need inheritance. Generic `setSystemConfigByKey` / `getSystemConfigByKey` primitives
keep the two concerns clearly separated while reusing the same underlying storage. They are
built on `configuration-repository`'s `loadConfig` / `persistConfig` / `deleteConfig`
parameterized by a separate `system.*` namespace — reusing the two-layer cache logic instead
of duplicating it — and stay domain-agnostic, operating purely on opaque keys and values, so
they can back other SDK-managed data in the future (`system.events`, etc.).

**Why a standalone `association` action?**
The `installation` action is conditionally deployed, apps without custom install steps,
webhooks, events, or Admin UI SDK do not deploy it. Using it as the host would silently skip
the store call for those apps. A dedicated always-deployed action with a single responsibility
is the correct model and was agreed upon by the team.

**Why export from the root entrypoint?**
A dedicated subpath adds indirection without benefit. Exporting from `@adobe/aio-commerce-lib-app`
directly keeps the import consistent with how the rest of the SDK is consumed.

**What is the impact of not doing this?**
Every app that needs the Commerce Base URL in runtime actions continues to implement its own
storage and retrieval logic with no automatic cleanup on unassociation and no standardised API.

## Future possibilities

- The stored shape can be extended with `projectId` and `workspaceId` at association time,
  providing data needed by other planned SDK features without requiring a new association step.
