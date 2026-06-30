# Runtime Event Emission from Configured Providers

- **Ticket:** [CEXT-6270](https://jira.corp.adobe.com/browse/CEXT-6270)
- **Created:** 2026-06-23
- [ ] **Implemented**

## Summary

Add a `publishEvent` helper to `@adobe/aio-commerce-lib-app` that lets a runtime action
publish a custom I/O Event by referencing the provider and event as declared in
`app.commerce.config.ts`, with no knowledge of I/O Events provider IDs, event codes, or
CloudEvents formatting required. Provider resolution is backed by metadata written to system
storage during installation, so emit calls require no management API round-trip at runtime.

## Motivation

App Builder applications that use the eventing section of `app.commerce.config.ts` typically
do so to receive events from Commerce or external sources. But runtime actions sometimes need
to publish events too — decoupling business logic across actions by routing work through a
shared event rather than calling another action directly.

Today this requires manually looking up the I/O Events provider ID, computing the namespaced
event code, formatting a CloudEvents payload, and calling the ingress endpoint with the right
IMS token and OAuth scope. Every app that uses this pattern reimplements the same boilerplate.

**Goals:**

- Let developers publish any event declared in their eventing configuration by provider key
  and event name, without assembling lower-level I/O Events details.
- Resolve provider ID and event code at runtime from data written to system storage at install
  time, so there is no additional management API call on the hot path.
- Consistent authentication model with the rest of the SDK (explicit IMS auth param).
- Clear, actionable error messages when the provider key or event name is not found.

**Non-goals:**

- Cross-app event emission; only events declared in the current app's config are in scope.
- Type-checking the event payload against the schema declared in the config's `fields` or
  `rules`.
- Batch emit; calling `publishEvent` in a loop is the expected pattern.

## Developer experience

After this feature ships, publishing a custom event from a runtime action looks like this:

```ts
import { publishEvent } from "@adobe/aio-commerce-lib-app";
import { createAdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events";
import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";

export async function main(params) {
  const client = createAdobeIoEventsApiClient({
    auth: resolveImsAuthParams(params),
    config: { ingressBaseUrl: params.AIO_EVENTS_INGRESS_BASE_URL },
  });

  await publishEvent({
    client,
    provider: "order-events",
    event: "order.created",
    payload: { orderId: "100000123", total: 149.99 },
  });
}
```

`provider` is the `key` of an event provider declared in `app.commerce.config.ts`. `event`
is the `name` of an event within that provider. Both must match the configuration exactly. The
`payload` is a JSON object; the SDK wraps it in a CloudEvents envelope before sending.

`config.ingressBaseUrl` defaults to `https://eventsingress.adobe.io/` when not set. Stage
environments set `AIO_EVENTS_INGRESS_BASE_URL` in the action inputs to target the stage
ingress — no code change needed. The action must have `AIO_COMMERCE_AUTH` inputs configured.

**Example configuration** that backs the call above:

```ts
eventing: {
  commerce: [
    {
      provider: {
        key: "order-events",
        label: "Order Events",
        description: "Events related to order lifecycle",
      },
      events: [
        {
          name: "order.created",
          label: "Order Created",
          description: "Triggered when a new order is placed",
          runtimeActions: ["my-package/handle-order-created"],
        },
      ],
    },
  ],
}
```

**Error messages** — when the call cannot be resolved:

| Situation                                     | Error                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Installation has not run or used an older SDK | `EventsDataNotInitializedError`: "No eventing installation data found. Re-run the app installation to initialize event provider metadata." |
| Provider key not found                        | `ProviderNotFoundError`: "No event provider with key 'order-events' found in the app eventing configuration."                              |
| Event name not found                          | `EventNotFoundError`: "No event named 'order.created' found under provider 'order-events'."                                                |

All three errors extend a common `PublishEventError` base so callers can catch them with a
single clause when granular handling is not needed.

## Design

### Provider metadata stored at installation time

The installation step writes a `system.events` entry to the system config storage
(`setSystemConfigByKey("events", ...)` from `@adobe/aio-commerce-lib-config`). The write
happens after the I/O Events provider is created or verified; on reinstall the entry is
overwritten, keeping stored data in sync with live provider IDs. If the write fails, the
installation step fails — a silent failure here would surface only later at runtime as an
`EventsDataNotInitializedError`, which is hard to diagnose.

The stored shape:

```ts
type StoredProviderEntry = {
  id: string; // I/O Events provider UUID
  events: Record<string, string>; // event.name → fully qualified event code
};

type StoredEventsData = {
  providers: Record<string, StoredProviderEntry>; // provider.key → entry
};
```

The key for each provider is `provider.key`, or the slugified label when `key` is omitted —
the same fallback used by `generateInstanceId`. The event code is the value returned by
`getIoEventCode(getNamespacedEvent(metadata, event.name), providerType)`, the same
computation already performed during installation.

### I/O Events publish endpoint

The I/O Events ingress (`https://eventsingress.adobe.io/`) accepts a CloudEvents 1.0 payload.
The required fields are `specversion`, `type` (the event code), `source`
(`urn:uuid:{providerId}`), `id` (a fresh UUID per call — the API requires `source + id` to
be unique per distinct event), `datacontenttype: "application/json"`, and `data` (the
payload). The request must carry two auth headers: `Authorization: Bearer {access_token}` and
`x-api-key: {client_id}`. Both are available from the standard IMS auth params resolved by
`resolveImsAuthParams`.

The ingress base URL is a new optional field on `IoEventsHttpClientConfig` in `lib-api`:
`ingressBaseUrl`, defaulting to `https://eventsingress.adobe.io/` when not set. This keeps
the ingress config co-located with the rest of the client config, consistent with how
`baseUrl` controls the management API endpoint on the same client.

### `publishEvent` in lib-app

A new export from the root entrypoint of `@adobe/aio-commerce-lib-app`:

```ts
publishEvent<TPayload extends Record<string, unknown>>(params: {
  client: AdobeIoEventsApiClient;
  provider: string;
  event: string;
  payload: TPayload;
}): Promise<void>
```

`publishEvent` accepts the existing `AdobeIoEventsApiClient` from `lib-events` — no new
client type is introduced. The generic `TPayload` lets callers enforce the payload shape at
the call site. The constraint `Record<string, unknown>` rules out primitives and arrays,
matching what the I/O Events ingress expects as `data`.

Internal flow of `publishEvent`:

1. Read `getSystemConfigByKey<StoredEventsData>("events")` from lib-config.
2. If null, throw `EventsDataNotInitializedError`.
3. Look up `params.provider` in `data.providers`. If not found, throw `ProviderNotFoundError`.
4. Look up `params.event` in the provider's `events` map. If not found, throw `EventNotFoundError`.
5. POST a CloudEvents envelope to `client`'s `ingressBaseUrl` with `Authorization` and `x-api-key` headers.

### Changeset

- `@adobe/aio-commerce-lib-api`: `minor` — adds `ingressBaseUrl` to `IoEventsHttpClientConfig`.
- `@adobe/aio-commerce-lib-app`: `minor` — new `publishEvent` export plus installation-side
  `system.events` write.
- `@adobe/aio-commerce-sdk`: `minor` — re-exports the above.

## Drawbacks

- A failed `system.events` write during installation blocks the entire install, even for apps
  that never call `publishEvent`.
- Providers created or renamed outside the SDK's installation flow will not be found.
- The `lib-config` read adds a network hop on every call (mitigated by the lib-state cache).

## Rationale and alternatives

**Install-time storage vs. runtime provider lookup.**
The alternative is to call the I/O Events management API on every `publishEvent` invocation —
list providers filtered by `instanceId`, find the matching one, and use its ID. This avoids
installation changes but adds a management API round-trip on the hot path for every event
published. The install step already computes and has the provider ID; persisting it is
incremental work with a meaningful runtime benefit.

**`lib-app` vs. `lib-events` for `publishEvent`.**
`lib-events` currently wraps the I/O Events **management** API only (providers, registrations,
metadata via `https://api.adobe.io/events`). `publishEvent` needs system storage and app
config resolution, so the high-level function lives in `lib-app`. The HTTP call to the ingress
is made via the existing `AdobeIoEventsApiClient` from `lib-events`, extended with an
`ingressBaseUrl` config field — no new client type needed, and the composability pattern
already used across the SDK is preserved: callers construct the client with the right config
and pass it in.

**Storing the pre-computed event code rather than recomputing at runtime.**
The event code could be recomputed from the provider type and app metadata, but that
requires storing those extra fields too. Storing the already-computed code is simpler and
avoids runtime coupling to the computation logic.
