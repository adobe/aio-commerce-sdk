# Commerce System Configuration on Association

- **Ticket:** [CEXT-6160](https://jira.corp.adobe.com/browse/CEXT-6160)
- **Created:** 2026-05-14
- [x] **Implemented**

## Summary

Store the Commerce system configuration — Base URL and deployment type (PaaS or SaaS) — as
reserved OpenWhisk package parameters when an app is associated with a Commerce instance, so that
runtime actions receive them automatically without each app reimplementing the same storage logic.
Clear the parameters when the app is unassociated.

## Motivation

Most Commerce apps need to call the Commerce API from their runtime actions. To do so, they need
the Base URL of the instance they are associated with and the deployment type (PaaS or SaaS).
Today, each app reimplements this logic independently: the B2B Approval Demo app, for example,
stores the Base URL in Business Configuration during a custom installation step.

This pattern has two problems:

1. **Duplication.** Every app that needs to call the Commerce API writes the same storage and
   retrieval logic.
2. **Wrong lifecycle.** Storing the config during installation does not keep it in sync with the
   association state. If the app is associated with a different instance, or unassociated, the
   stored config is not updated or cleared.

The SDK is already passed `commerceBaseUrl` and `commerceEnv` at every association and
unassociation event — the data apps need is already flowing through the system. The missing piece
is persistence tied to the association lifecycle and a standard way for runtime actions to consume
it.

**Goals:**

- Store the Commerce Base URL and deployment type (PaaS/SaaS) as OpenWhisk package parameters
  when an app is associated with a Commerce instance.
- Clear the stored parameters when the app is unassociated.
- Expose a typed helper that runtime actions can use to read the values from their params.

**Non-goals:**

- Storing any Commerce system configuration beyond Base URL and deployment type.
- Replacing the `AIO_COMMERCE_API_BASE_URL` and `AIO_COMMERCE_API_FLAVOR` package params set
  during installation. Those remain unchanged.
- Providing a mechanism for apps to override or augment the stored config.

## Developer experience

After this feature ships, the Commerce system configuration is available directly in the action's
`params` object under two reserved names:

| Reserved parameter      | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `AIO_COMMERCE_BASE_URL` | Commerce API base URL of the associated instance |
| `AIO_COMMERCE_ENV`      | Deployment type: `"saas"` or `"paas"`            |

A runtime action can read these directly:

```js
export async function main(params) {
  const baseUrl = params.AIO_COMMERCE_BASE_URL;
  const env = params.AIO_COMMERCE_ENV;
}
```

Or use the typed helper from the `./runtime` export:

```ts
import { getCommerceSystemConfig } from "@adobe/aio-commerce-lib-app/runtime";

export async function main(params) {
  const config = getCommerceSystemConfig(params);
  if (!config) {
    // App is not associated with a Commerce instance
    return {
      statusCode: 400,
      body: { error: "Not associated with a Commerce instance" },
    };
  }

  // config.baseUrl — the Commerce Base URL, e.g. "https://my-store.example.com"
  // config.env     — "saas" | "paas"
}
```

No custom storage setup is required. The SDK manages the parameters transparently during the
association lifecycle. Apps no longer need a custom installation step to store the Commerce Base
URL.

**Association and unassociation are handled automatically.** When `commerce-app-management`
associates an app with a Commerce instance, the SDK writes `AIO_COMMERCE_BASE_URL` and
`AIO_COMMERCE_ENV` to the OpenWhisk package. When the app is unassociated, those parameters are
removed. The runtime action always reflects the current association state.

**If `getCommerceSystemConfig` returns `null`**, the app is either not currently associated with a
Commerce instance, or the association predates this feature. Apps must handle this case explicitly.

**Available fields** returned by `getCommerceSystemConfig`:

| Field     | Type               | Description                              |
| --------- | ------------------ | ---------------------------------------- |
| `baseUrl` | `string`           | Commerce API base URL                    |
| `env`     | `"saas" \| "paas"` | Deployment type of the Commerce instance |

## Design

### Storage

The Commerce system configuration is stored as OpenWhisk package parameters on the package that
owns the installation action. Two reserved parameter names are used:

- `AIO_COMMERCE_BASE_URL` — the Commerce API base URL
- `AIO_COMMERCE_ENV` — the deployment type (`"saas"` or `"paas"`)

OpenWhisk injects all package parameters into every action's `params` object at invocation time,
so the values are available to runtime actions automatically — no additional read step is required.
The stored type is:

```ts
type CommerceSystemConfig = {
  baseUrl: string;
  env: "saas" | "paas";
};
```

### New routes on the installation action

Two new routes are added to the existing `installation` runtime action in `aio-commerce-lib-app`.

**`POST /installation/association`**

Writes `AIO_COMMERCE_BASE_URL` and `AIO_COMMERCE_ENV` to the OpenWhisk package. Called by
`commerce-app-management` immediately after the Extension Manager record for the association is
created successfully.

The handler:

1. Derives the package name from `process.env.__OW_ACTION_NAME` (set automatically by OpenWhisk).
2. Fetches the current package configuration via `ow.packages.get`.
3. Merges the two new parameters into the existing parameter list, preserving all others.
4. Writes the updated list back via `ow.packages.update`.

Request body:

```ts
{
  commerceBaseUrl: string;
  commerceEnv: "saas" | "paas";
}
```

Response: `200 OK` with the stored `CommerceSystemConfig`. The operation is idempotent —
re-associating with a different instance overwrites the previous values.

**`DELETE /installation/association`**

Removes `AIO_COMMERCE_BASE_URL` and `AIO_COMMERCE_ENV` from the OpenWhisk package parameters.
Called by `commerce-app-management` after unassociation completes. Other package parameters are
preserved.

Response: `204 No Content`.

These paths follow the same convention already established by `/installation/uninstallation`.

### New `./runtime` export from `aio-commerce-lib-app`

A new export entry `@adobe/aio-commerce-lib-app/runtime` exposes a typed helper for use inside
runtime actions:

```ts
/**
 * Returns the Commerce system configuration populated during association,
 * or null if the app is not currently associated with a Commerce instance.
 */
export function getCommerceSystemConfig(
  params: RuntimeActionParams,
): CommerceSystemConfig | null;
```

`params` is the standard `RuntimeActionParams` object every runtime action receives. The helper
reads `AIO_COMMERCE_BASE_URL` and `AIO_COMMERCE_ENV` from `params` and returns a typed
`CommerceSystemConfig`, or `null` if either value is absent. The function is synchronous — no
async call is needed because the values are already present in `params`.

### Changes to `commerce-app-management`

**`useAssociateApp`:** After the `POST /v2/extensions` call to the Extension Manager succeeds,
call `POST /installation/association` on the app's installation endpoint with `commerceBaseUrl`
and `commerceEnv`. Both values are already available in scope from `useCommerceInstance()`. This
step is best-effort: a failure is logged but the Extension Manager record is not rolled back.

**`useUnassociateApp`:** After unassociation completes (whether via the new `POST /uninstallation`
path or the legacy `DELETE /installation` fallback), call `DELETE /installation/association` to
remove the stored parameters. This step is also best-effort.

**`UnassociateAppDialog`:** The dialog previously took a shortcut for apps in
`APP_STATUS_ASSOCIATED` state — it called `handleUninstallSuccess()` directly without going
through `useUnassociateApp`, so `DELETE /installation/association` was never called for those
apps. The fix exposes `clearCommerceSystemConfig` from `useUnassociateApp` and calls it in the
shortcut branch before completing the unassociation.

### Edge cases

- **Association before this feature existed.** Apps associated before `POST /association` was
  introduced have no stored parameters. `getCommerceSystemConfig` returns `null`. Apps must handle
  this explicitly.
- **Association endpoint unavailable.** If the app's runtime is not deployed or the action
  returns an unexpected error, `commerce-app-management` logs the failure and continues — the
  Extension Manager record is still valid. The parameters will be absent until the app is
  re-associated.
- **Concurrent associations.** The last write wins. No conflict detection is required.
- **Package name derivation.** The package name is derived from `process.env.__OW_ACTION_NAME`,
  which OpenWhisk sets automatically on every action invocation. The format is
  `/namespace/package-name/action-name`; the package name is the second-to-last segment.

## Drawbacks

- Introduces a new network call from `commerce-app-management` to the app's runtime action as
  part of the association flow. This creates a new failure mode: the Extension Manager record can
  succeed while the parameter update fails, leaving the app associated but without the stored
  parameters.
- The `POST /association` handler performs a read-then-write on the OpenWhisk package to preserve
  existing parameters. This is two API calls and is not atomic; a concurrent update between the
  read and write could cause a parameter to be lost.

## Rationale and alternatives

**Why OpenWhisk package parameters?** Package parameters are the standard mechanism OpenWhisk uses
to deliver configuration to actions — they are injected automatically into every action's `params`
object at invocation time. Runtime actions receive the Commerce URL and environment the same way
they receive `LOG_LEVEL` or `OAUTH_CLIENT_ID`: no extra call, no extra dependency.

**Why routes on the existing installation action rather than a new `association` action?** The
installation action is already the entry point `commerce-app-management` calls throughout the app
lifecycle, and its endpoint is already known from the app's extension points metadata. Reusing it
avoids introducing a new action name that must be deployed, registered, and separately discovered.
The `/association` sub-path is consistent with the existing `/uninstallation` sub-path pattern.

**Why a `./runtime` export rather than reading params directly?** A dedicated helper provides a
typed return value and documents the reserved parameter names in one place. Apps that read
`params.AIO_COMMERCE_BASE_URL` directly are free to do so — the helper is a convenience, not a
requirement.

**What is the impact of not doing this?** Every app that needs the Commerce Base URL in runtime
actions continues to implement its own storage logic, with no automatic cleanup on unassociation
and no standardized retrieval API.

## Future possibilities

- The stored config could be extended with additional parameters (e.g. store view code, API
  version) without changing the public helper signature.
- `getCommerceSystemConfig` could become the foundation for a higher-level helper that initialises
  a ready-to-use Commerce HTTP client, removing even more boilerplate from app developers.
