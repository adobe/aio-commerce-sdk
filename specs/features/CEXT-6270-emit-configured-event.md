# Runtime Event Emission from Configured Providers

- **Ticket:** [CEXT-6270](https://jira.corp.adobe.com/browse/CEXT-6270)
- **Created:** 2026-06-23
- [ ] **Implemented**

## Summary

Add an `emitConfiguredEvent` helper to `@adobe/aio-commerce-lib-app` that lets a runtime
action publish a custom I/O Event by referencing the provider and event as declared in
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

- Let developers emit any event declared in their eventing configuration by provider key and
  event name, without assembling lower-level I/O Events details.
- Resolve provider ID and event code at runtime from data written to system storage at install
  time, so there is no additional management API call on the hot path.
- Consistent authentication model with the rest of the SDK (explicit IMS auth param).
- Clear, actionable error messages when the provider key or event name is not found.

**Non-goals:**

- Cross-app event emission; only events declared in the current app's config are in scope.
- Type-checking the event payload against the schema declared in the config's `fields` or
  `rules`.
- Batch emit; calling `emitConfiguredEvent` in a loop is the expected pattern.

## Developer experience

After this feature ships, emitting a custom event from a runtime action looks like this:

```ts
import { emitConfiguredEvent } from "@adobe/aio-commerce-lib-app";

export async function main(params) {
  await emitConfiguredEvent({
    provider: "order-events",
    event: "order.created",
    payload: { orderId: "100000123", total: 149.99 },
  });
}
```

`provider` is the `key` of an event provider declared in `app.commerce.config.ts`. `event`
is the `name` of an event within that provider. Both must match the configuration exactly. The
`payload` is any JSON-serializable value; the SDK wraps it in a CloudEvents envelope before
sending.

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

All three errors extend a common `EmitConfiguredEventError` base so callers can catch them
with a single clause when granular handling is not needed.

## Design

### Provider metadata stored at installation time

The installation step writes a `system.events` entry to the system config storage (`setSystemConfigByKey("events", ...)` from `@adobe/aio-commerce-lib-config`).
The write happens after the I/O Events provider is created or verified; on reinstall the
entry is overwritten, keeping stored data in sync with live provider IDs.

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

A new function `publishIoEvent` is added to `@adobe/aio-commerce-lib-events/io-events`:

```ts
publishIoEvent(params: {
  providerId: string;
  eventCode: string;
  payload: unknown;
}): Promise<void>
```

It constructs a CloudEvents 1.0 envelope (`specversion`, `type` = `eventCode`,
`source` = `urn:uuid:{providerId}`, `id` = fresh UUID, `datacontenttype: "application/json"`,
`data` = `payload`) and POSTs to the I/O Events ingress (`https://eventsingress.adobe.io/`).
Authentication is sourced as described in Unresolved questions. Errors from the ingress
propagate as-is to the caller.

### `emitConfiguredEvent` in lib-app

A new export from the root entrypoint of `@adobe/aio-commerce-lib-app`:

```ts
emitConfiguredEvent(params: {
  provider: string;
  event: string;
  payload: unknown;
}): Promise<void>
```

Internal flow:

1. Read `getSystemConfigByKey<StoredEventsData>("events")` from lib-config.
2. If null, throw `EventsDataNotInitializedError`.
3. Look up `params.provider` in `data.providers`. If not found, throw `ProviderNotFoundError`.
4. Look up `params.event` in the provider's `events` map. If not found, throw `EventNotFoundError`.
5. Call `publishIoEvent({ providerId: entry.id, eventCode, payload: params.payload })`.

### Changeset

- `@adobe/aio-commerce-lib-events`: `minor` — new `publishIoEvent` export.
- `@adobe/aio-commerce-lib-app`: `minor` — new `emitConfiguredEvent` export plus
  installation-side `system.events` write.
- `@adobe/aio-commerce-sdk`: `minor` — re-exports both above.

## Drawbacks

- A failed `system.events` write during installation leaves the entry absent, surfacing only
  when `emitConfiguredEvent` is called at runtime — hard to diagnose.
- Providers created or renamed outside the SDK's installation flow will not be found.
- The `lib-config` read adds a network hop on every call (mitigated by the lib-state cache).

## Rationale and alternatives

**Install-time storage vs. runtime provider lookup.**
The alternative is to call the I/O Events management API on every `emitConfiguredEvent`
invocation — list providers filtered by `instanceId`, find the matching one, and use its ID.
This avoids installation changes but adds a management API round-trip on the hot path for
every event emitted. The install step already computes and has the provider ID; persisting
it is incremental work with a meaningful runtime benefit.

**`lib-app` vs. `lib-events` for `emitConfiguredEvent`.**
`lib-events` is a set of API wrappers with no knowledge of the app config schema or system
storage. `emitConfiguredEvent` needs both; adding it to `lib-events` would invert the
dependency direction. The lower-level `publishIoEvent` goes in `lib-events` since it needs
only the ingress URL and a provider ID — no config, no storage.

**Not storing the event code, only the provider ID.**
The event code could be recomputed at runtime, but that requires also storing the provider
type and app metadata. Storing the pre-computed event code is simpler and avoids runtime
coupling to the computation logic.

## Unresolved questions

- **Authentication.** Publishing to the I/O Events ingress requires an IMS access token.
  The ticket example shows no `auth` parameter in the call, so the intent is for the SDK to
  source the token automatically (e.g. from env vars or stored workspace credentials).
  Confirm whether this is feasible, or whether the developer will need to pass `auth`
  explicitly as in `getCommerceClient`. Also confirm which OAuth scope the ingress requires
  and whether the SDK-managed credentials already include it.

- **Installation failure handling.** If the `system.events` write fails, should the
  installation step fail hard or log a warning and continue?
