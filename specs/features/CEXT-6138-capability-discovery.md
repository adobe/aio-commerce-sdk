# Capability Discovery

- **Ticket:** [CEXT-6138](https://jira.corp.adobe.com/browse/CEXT-6138)
- **Created:** 2026-04-23
- [x] **Implemented**

## Summary

Provide a formal discoverability mechanism for the features and endpoints exposed
by a Commerce SDK-based app, so that any authenticated client can reliably
determine what is available for a given deployment without needing SDK-specific
knowledge.

## Motivation

As the Commerce SDK grows in scope, clients need to know which features and
endpoints are active for a given deployment. Without a formal mechanism, clients
are forced to infer feature availability at runtime by calling endpoints and
inspecting response shapes — a fragile pattern that couples client logic to
internal API details.

`commerce-app-management` is a concrete example: it currently calls `getAppConfig`
and inspects the response shape to decide which UI features to show or hide. Every
new SDK capability requires a corresponding change in `commerce-app-management` to
detect it. This does not scale as the number of clients and SDK features grows.

**Goals:**

- Give any authenticated client a stable, versioned description of which endpoints are active for a given deployment.
- Remove the need for clients to infer feature availability by parsing response shapes or probing endpoints.
- Keep the SDK as the single source of truth for the API contract.

**Non-goals:**

- Providing a general API documentation portal or developer-facing reference — the full spec in the SDK repository serves that purpose.
- Runtime introspection of config-dependent availability — endpoint availability is determined at build time and is fixed for a given deployment.
- Client code generation from the spec.

## Developer experience

An authenticated client fetches `/app-config/openapi.json` with a valid IMS
bearer token:

```http
GET /app-config/openapi.json
Authorization: Bearer <ims-token>
```

The response is an OpenAPI 3.x document listing only the endpoints active for
that deployment. A client uses it to adapt its behaviour — no SDK-specific
knowledge required.

**Example: `commerce-app-management`**

On load, `commerce-app-management` already holds an IMS token from the user
session. It fetches `/app-config/openapi.json` and drives UI visibility based on
which endpoints are present — showing or hiding features accordingly. This
replaces the current pattern of calling `getAppConfig` and inferring availability
from the response shape.

Other clients (CLI tools, integrations, third-party UIs) follow the same pattern:
obtain an IMS token, fetch the spec, adapt accordingly.

## Design

### 1. Full spec in the SDK package

`aio-commerce-lib-app` ships a `docs/openapi.json` (OpenAPI 3.x) documenting **all**
endpoints the SDK can expose. This file is committed to the repository and the
published npm package, and is the single source of truth for the SDK's API contract.
It carries two version fields: `info.version` for the API contract version and
`info.x-meta.packageVersion` for the npm package version (kept in sync via the
`version` lifecycle script).

### 2. Capability-filtered spec served at request time

Filtering happens at request time inside the `app-config` action. The full
`docs/openapi.json` is bundled into the action via a dynamic import (inlined by the
bundler at build time), and `buildOpenApiSpec` applies two passes:

1. **Path stripping** — removes routes whose config domain is not active (e.g.
   `/config` and `/scope-tree` when `businessConfig.schema` is absent, `/registration`
   when `adminUiSdk` is absent, `/installation*` when installation is not required).
2. **Schema pruning** — removes `components/schemas` entries unreachable from the
   remaining paths, following `$ref`s transitively.

Availability is determined by the active config domains derived from `app.commerce.config.ts`
at runtime, not from static build-time analysis.

### 3. Content-addressed caching

`GET /app-config` returns an `openApiSpecUrl` field — the URL of the filtered spec
for this deployment, with a short SHA-256 cache key as a `ck` query parameter:

```
https://<namespace>.adobeioruntime.net/api/v1/web/app-management/app-config/openapi.json?ck=<hash>
```

The cache key is derived from the package version, the OpenAPI spec version
(`info.version`), and the active config domains. When `GET /openapi.json` receives a
matching `ck`, it responds with `Cache-Control: public, max-age=31536000, immutable`.
Requests without a matching key are served without cache headers, keeping the
bare URL always fresh.

### 4. OpenAPI endpoint on the `app-config` action

The filtered spec is served by a new `GET /openapi.json` route on the existing
`app-config` runtime action, protected by the same IMS authentication as all other
SDK endpoints.

Path: `/app-config/openapi.json`

### 5. SDK upgrades

When an app upgrades its `aio-commerce-lib-app` dependency, the bundled
`docs/openapi.json` in the new package version may include new endpoints or
updated schemas. On the next deployment, `buildOpenApiSpec` derives the active
config domains at request time and serves an updated filtered spec. The cache key
changes whenever the spec version or domains change, so clients automatically
pick up the new spec without manual cache invalidation.

No manual spec maintenance is required. New SDK features are automatically included
if their config domain is already active. If a new feature introduces a new config
domain, the app developer opts in by declaring it in `app.commerce.config.ts` and
redeploying.

The `app-config` action is always present in every SDK-based deployment, so the
`/app-config/openapi.json` endpoint is always reachable without any additional
routing configuration.

## Drawbacks

- Clients must hold a valid IMS token before they can discover what is available,
  which adds a bootstrap step for clients that don't already have one.
- The `app-config` action takes on a dual responsibility: serving the app config
  and serving the deployment's API contract. These are related but distinct concerns.

## Rationale and alternatives

The filtered spec is auth-gated to prevent **deployment fingerprinting**: it
reveals which features a specific deployment has enabled, which is
deployment-specific metadata that should not be publicly enumerable. Schema
disclosure is not a concern since the full spec is already public in the
`aio-commerce-sdk` repository.

Alternatives considered:

- **Runtime inspection of `getAppConfig`** — current approach; fragile and
  requires SDK-specific knowledge in every client.
- **Unauthenticated static file** — simpler to consume but exposes
  deployment-specific configuration without auth.
- **Capabilities list endpoint** — a simpler boolean feature map instead of a
  full OpenAPI spec; less powerful and doesn't give clients the full contract.
- **Dedicated `metadata` runtime action at `/__metadata__/openapi.json`** — cleaner
  separation of concerns and a natural namespace for future deployment metadata, but
  adds one runtime action to every deployment. Since `app-config` is already
  present in all deployments, always under the same path, and already holds an IMS
  authentication requirement, reusing it avoids the extra action without meaningful
  loss of clarity. The concerns are related: both `app-config` and the OpenAPI spec
  describe what a deployment exposes.

## Unresolved questions

- Whether the full `openapi.json` in the SDK package should eventually be generated
  from the `HttpActionRouter` schemas (e.g. via Standard Schema +
  `@standard-community/standard-openapi`) rather than hand-authored.
- Whether the `version` lifecycle script correctly fires during `pnpm changeset version`
  (tracked separately).

## Future possibilities

- The `app-config` action could be extended to expose additional deployment
  information beyond the OpenAPI spec (e.g. SDK version, configured domains)
  as additional routes under `/app-config/`.
- The full `openapi.json` in the SDK package could be used to power generated
  client libraries or documentation automatically.
