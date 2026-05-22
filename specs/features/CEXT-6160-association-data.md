# Association Data

- **Ticket:** [CEXT-6160](https://jira.corp.adobe.com/browse/CEXT-6160)
- **Created:** 2026-05-21
- [ ] **Implemented**

## Summary

Store the Commerce instance details, Base URL and deployment type, when an app is associated
with a Commerce instance, and expose a typed async helper so that any runtime action can retrieve them without custom storage setup.

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
unassociation event. The missing piece is a standard persistence mechanism tied to the association lifecycle and a typed helper for runtime actions to consume it.

**Goals:**

- Store the Commerce Base URL and deployment type when an app is associated with an instance.
- Clear the stored data when the app is unassociated.
- Expose a typed async helper that any runtime action can use to retrieve the data.
- Work for all app types, including those without a custom installation flow.

**Non-goals:**

- Storing any data beyond Base URL and deployment type in this iteration.
- Changing the existing `AIO_COMMERCE_API_BASE_URL` and `AIO_COMMERCE_API_FLAVOR`
  deployment-time parameters set in `actions.config.yaml`.
- Providing any mechanism for apps to override or augment the stored data.

## Developer experience

After this feature ships, any runtime action can retrieve the associated Commerce instance
details with a single async call:

```ts
import { getAssociatedCommerceInstance } from "@adobe/aio-commerce-lib-app";

export async function main(params) {
  const instance = await getAssociatedCommerceInstance(params);

  if (!instance) {
    return {
      statusCode: 400,
      body: { error: "App is not associated with a Commerce instance." },
    };
  }

  // instance.baseUrl — e.g. "https://my-store.example.com"
  // instance.env     — "saas" | "paas"

  const response = await fetch(`${instance.baseUrl}/rest/V1/products`, {
    headers: { Authorization: `Bearer ${params.COMMERCE_API_TOKEN}` },
  });
}
```

No custom storage setup is required. The SDK manages the data automatically during the
association lifecycle. The helper works from any runtime action regardless of which OpenWhisk
package the action belongs to.

**If `getAssociatedCommerceInstance` returns `null`**, the app is either not currently associated or was associated before this feature was introduced. Apps must handle this case explicitly.

**Available fields** on the returned object:

| Field     | Type               | Description                              |
| --------- | ------------------ | ---------------------------------------- |
| `baseUrl` | `string`           | Commerce API base URL                    |
| `env`     | `"saas" \| "paas"` | Deployment type of the Commerce instance |

## Design

### Storage

The association data is stored using the infrastructure already established in
**`aio-commerce-lib-config`** — specifically, the shared `getSharedState()` utility from
`aio-commerce-lib-config/source/utils/repository.ts`, which provides a lazy-initialized
Adobe I/O State client shared across the SDK.

A new module is added to `aio-commerce-lib-config` specifically for association data,
separate from the existing Business Configuration module. It uses the same `getSharedState()`
client but stores under a dedicated reserved key (`association`) rather than the
`configuration.{scopeCode}` keys used by Business Configuration.

This has two important properties for this use case:

- **Package-agnostic.** Adobe I/O State is shared across all actions within the same App
  Builder application, regardless of which OpenWhisk package they belong to.
- **No parameter drilling.** The helper reads directly from state. Callers do not need to
  pass the data through every layer of the call stack.

The new module exposes three internal functions used by `aio-commerce-lib-app`:

```ts
// aio-commerce-lib-config (new internal module)
setAssociationData(data: AssociatedCommerceInstance): Promise<void>
getAssociationData(): Promise<AssociatedCommerceInstance | null>
clearAssociationData(): Promise<void>
```

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

**`POST /`** — Store association data

Request body:

```ts
{
  commerceBaseUrl: string;
  commerceEnv: "saas" | "paas";
}
```

The handler validates the body and calls `setAssociationData` from the new
`aio-commerce-lib-config` association module. The operation is idempotent — re-associating
with a different instance overwrites the previous values.

Response: `200 OK`.

**`DELETE /`** — Clear association data

Calls `clearAssociationData` from the `aio-commerce-lib-config` association module.

Response: `204 No Content`.

Both routes use the `HttpActionRouter` with the `logger` middleware, consistent with the
patterns used across other runtime actions in `aio-commerce-lib-app`.

### New `getAssociatedCommerceInstance` helper

A new export is added to the root entrypoint of `@adobe/aio-commerce-lib-app`:

```ts
/**
 * Returns the Commerce instance this app is currently associated with,
 * or null if the app is not associated or was associated before this
 * feature was introduced.
 */
export async function getAssociatedCommerceInstance(
  params: RuntimeActionParams,
): Promise<AssociatedCommerceInstance | null>;
```

`params` is the standard params object every runtime action receives. Internally it calls
`getAssociationData` from the `aio-commerce-lib-config` association module. The function is
async because the underlying Adobe I/O State read is a network call.

### Client integration

Any client that manages the app association lifecycle is responsible for driving two calls
against the `association` endpoint. The endpoint URL is discoverable from the app's extension
points metadata, registered in `workerProcess` alongside the existing `app-config` and
`installation` hrefs.

**On association** — after the app is successfully registered with the Extension Manager,
the client calls `POST /` with the Commerce instance details. This step is best effort a failure does not roll back the registration.

**On unassociation** — after unassociation completes, the client calls `DELETE /` to remove
the stored data. This step is also best-effort.

### Edge cases

- **Apps associated before this feature.** No stored data exists; `getAssociatedCommerceInstance`
  returns `null`. Apps must handle this explicitly.
- **Association endpoint unreachable.** If the runtime is not deployed or returns an unexpected
  error, the calling client should log the failure and continue. The stored data will be absent
  until the app is re-associated.
- **Concurrent associations.** The last write wins. No conflict detection is required.

## Drawbacks

- Adds a new runtime action to every app.
- `getAssociatedCommerceInstance` is async. Callers must await it, unlike a direct `params` read.
- Introduces a `aio-commerce-lib-config` network call on every action invocation that calls
  the helper.

## Rationale and alternatives

**Why `aio-commerce-lib-config` infrastructure rather than OpenWhisk package parameters?**
OpenWhisk package parameters are scoped to a single package. Writing params to the
`app-management` package makes them available only to `app-management` actions. Developer
runtime actions in other packages never receive them, making the feature ineffective for
the primary use case. Adobe I/O State — accessed via the shared `getSharedState()` utility
already established in `aio-commerce-lib-config` — is accessible to all actions within the
same application regardless of package boundaries.

**Why a new module in `aio-commerce-lib-config` rather than using `setConfiguration` directly?**
The existing `setConfiguration`/`getConfiguration` API in `aio-commerce-lib-config` is
designed for Business Configuration — scope-tree based values keyed by Commerce scope codes.
Association data is app-level metadata, not scope-specific. A dedicated module with its own
reserved key (`association`) keeps the two concerns clearly separated while reusing the same
underlying storage infrastructure.

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

## Unresolved questions

- **Reserved config key naming.** The exact key used to store the data in `aio-commerce-lib-config`
  needs to be defined as a reserved SDK concern so that apps do not accidentally collide with it.
- **Backfill for legacy apps.** A mechanism to backfill stored data for apps associated before
  this feature was introduced is out of scope but should be tracked.

## Future possibilities

- The stored shape can be extended with `projectId` and `workspaceId` at association time,
  providing data needed by other planned SDK features without requiring a new association step.
- `getAssociatedCommerceInstance` could become the foundation for a higher-level helper that
  initialises a ready-to-use Commerce HTTP client.
