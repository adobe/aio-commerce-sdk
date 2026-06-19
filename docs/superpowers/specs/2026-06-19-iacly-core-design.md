# `iacly` core types + `aio-commerce-lib-iacly`

- **Created:** 2026-06-19
- [ ] **Implemented**

## Summary

Two new private packages: `@aio-commerce-sdk/iacly`, a dependency-free TypeScript library that
defines the types for a declarative resource reconcile engine, and
`@aio-commerce-sdk/aio-commerce-lib-iacly`, which implements concrete providers for Commerce
webhooks, Adobe I/O Events (Commerce and custom), and Admin UI extensions. Following the Terraform
mental model, a **Provider** is a named group of related **Resources**; a Resource is the
manageable unit with CRUD operations. Both packages remain private for this iteration. The
providers serve as both real SDK implementations and the canonical validation of the `iacly`
interface.

## Motivation

Commerce apps on App Builder need to manage a set of external resources — webhook registrations,
I/O Events registrations, Admin UI extensions — that must be created on install, updated when
configuration changes, and removed on uninstall. Today, each of these is managed by ad-hoc
imperative code spread across install and uninstall runtime actions. This leads to several
recurring problems:

- **Orphaned resources on uninstall.** Uninstall logic is written against the current declarative
  config. If config drifted or was redeployed between install and uninstall, resources that were
  actually installed are no longer reflected in the config, and are never cleaned up.
- **No drift detection.** There is no standard way to detect that a live resource was modified
  outside of the app (e.g. a webhook manually edited in the Commerce admin), or to reconcile it
  back to the declared state.
- **No dependency ordering.** Resources that depend on each other (e.g. an I/O Events registration
  that depends on a custom event provider) must be manually sequenced. A failure midway leaves
  the system in a partial state with no structured recovery path.
- **No plan step.** Install actions apply changes blindly — there is no reviewable diff of what
  will change before mutations begin.

Standard IaC tools (Terraform, Pulumi) solve all of these, but require a long-running engine
binary, a durable state backend, and the ability to install arbitrary tooling. App Builder
runtime actions are short-lived serverless Node.js functions with a hard bundle-size ceiling and
no persistent filesystem. These assumptions are incompatible.

`iacly` fills the gap: a reconcile loop small enough to ship as a dependency, with no runtime
requirements beyond Node.js.

**Goals:**

- Define a minimal, dependency-free TypeScript interface for declarative resource management.
- Establish `Resource` as the manageable unit and `Provider` as its grouping container.
- Support the full reconcile cycle: check → list → diff → plan → apply.
- Produce an `AppliedSnapshot` after every reconcile that makes teardown deterministic regardless
  of config drift.
- Validate the interface against real Commerce SDK resource types before locking it in.

**Non-goals:**

- Implementing the reconcile engine itself (the runtime that executes providers in order, enforces
  locks, and emits events). This is the next iteration.
- Persistence. The caller owns where and how the `AppliedSnapshot` is stored.
- Commerce-specific business logic beyond what the providers need.
- Replacing imperative installation steps. `iacly` providers are an additive option; imperative
  steps remain a permanent, first-class installation mechanism alongside them.

## Developer experience

### Implementing a provider

A **Provider** groups related resources and acts as their composition root — it takes shared
clients in its constructor and wires them into each resource internally. A **Resource** implements
`Resource<TConfig, TDesired, TState>` for one manageable unit. `TConfig` is the full app config
shared by all resources; `TDesired` is this resource's per-item config; `TState` is the shape
returned by the live system.

`check(config)` is the entry point on each resource: it receives the full app config, extracts
the relevant items, validates them, and returns the normalised list. Returning `[]` signals that
this resource has nothing to do — the engine still checks the snapshot for orphans to delete.

```ts
import type {
  Resource,
  Provider,
  DiffResult,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";

type AppConfig = { webhooks?: WebhookConfig[]; events?: EventConfig[] /* … */ };
type WebhookConfig = {
  code: string;
  url: string;
  method: string;
  fields: string[];
};
type Webhook = {
  id: number;
  code: string;
  url: string;
  method: string;
  active: boolean;
};

// Resource — the manageable unit; internal to WebhooksProvider
class WebhookResource implements Resource<AppConfig, WebhookConfig, Webhook> {
  readonly kind = "webhooks/webhook";
  readonly dependsOn = [] as const;

  constructor(private readonly client: WebhooksClient) {}

  async check(config: AppConfig): Promise<readonly WebhookConfig[]> {
    return parse(array(WebhookConfigSchema), config.webhooks ?? []);
  }

  keyFromDesired(desired: WebhookConfig): string {
    return desired.code;
  }
  keyFromState(state: Webhook): string {
    return state.code;
  }

  async list(): Promise<Webhook[]> {
    return this.client.listWebhooks();
  }

  diff(
    current: Webhook | null,
    desired: WebhookConfig,
  ): DiffResult<WebhookConfig, Webhook> {
    if (!current) return { kind: "create", desired };
    if (current.url !== desired.url || current.method !== desired.method) {
      return { kind: "update", current, desired };
    }
    return { kind: "noop" };
  }

  async create(
    desired: WebhookConfig,
    _upstream: UpstreamOutputs,
  ): Promise<Webhook> {
    return this.client.createWebhook(desired);
  }

  async update(
    _id: string,
    current: Webhook,
    desired: WebhookConfig,
    _upstream: UpstreamOutputs,
  ): Promise<Webhook> {
    return this.client.updateWebhook(current.id, desired);
  }

  async delete(_id: string, current: Webhook): Promise<void> {
    await this.client.deleteWebhook(current.id);
  }
}

// Provider — public; takes the client and wires it into its resources
export class WebhooksProvider implements Provider<AppConfig> {
  readonly name = "webhooks";
  readonly resources: readonly Resource<AppConfig, unknown, unknown>[];

  constructor(client: WebhooksClient) {
    this.resources = [new WebhookResource(client)];
  }
}
```

Resources that expose outputs to downstream resources implement `outputs()`. The convention in
`aio-commerce-lib-iacly` is a separate `outputs.ts` file per provider that exports a typed
accessor — eliminating casting at consumer call sites.

`io-events/provider` manages multiple items (one per event source in config). Its `outputs()`
returns a map keyed by `instance_id` so downstream resources can look up the right provider ID
using the instance ID they already carry in their own desired config:

```ts
// source/events/io-events/provider-resource.ts  (internal)
class IoEventsProviderResource implements Resource<
  AppConfig,
  IoEventProviderConfig,
  IoEventProvider
> {
  readonly kind = "io-events/provider";
  readonly dependsOn = [] as const;

  // Keys by instance_id so downstream resources can look up by their own providerInstanceId.
  outputs(states: readonly IoEventProvider[]): ProviderOutputs {
    return Object.fromEntries(
      states.map((p) => [p.instance_id, { providerId: p.id }]),
    );
  }

  async create(
    desired: IoEventProviderConfig,
    _upstream: UpstreamOutputs,
  ): Promise<IoEventProvider> {
    return this.client.createEventProvider(desired);
  }
  // ...
}

// source/events/io-events/event-metadata-resource.ts  (internal)
// One item per (provider × event type). Must complete before io-events/registration —
// registrations reference event codes by value, so those codes must already exist.
class IoEventsEventMetadataResource implements Resource<
  AppConfig,
  IoEventMetadataConfig,
  IoEventMetadata
> {
  readonly kind = "io-events/event-metadata";
  readonly dependsOn = ["io-events/provider"] as const;

  async create(
    desired: IoEventMetadataConfig,
    upstream: UpstreamOutputs,
  ): Promise<IoEventMetadata> {
    const { providerId } = IoEventsOutputs.provider(
      upstream,
      desired.providerInstanceId,
    );
    return this.client.createEventMetadataForProvider({
      providerId,
      ...desired,
    });
  }
  // ...
}

// source/events/io-events/outputs.ts  (exported)
export const IoEventsOutputs = {
  provider: (
    upstream: UpstreamOutputs,
    instanceId: string,
  ): { providerId: string } => {
    const map = upstream.get("io-events/provider") as Record<
      string,
      { providerId: string }
    >;
    return map[instanceId]!;
  },
};

// source/events/io-events/registration-resource.ts  (internal)
import { IoEventsOutputs } from "./outputs.js";

class IoEventsRegistrationResource implements Resource<
  AppConfig,
  IoEventRegistrationConfig,
  IoEventRegistration
> {
  readonly kind = "io-events/registration";
  readonly dependsOn = ["io-events/provider"] as const;

  async create(
    desired: IoEventRegistrationConfig,
    upstream: UpstreamOutputs,
  ): Promise<IoEventRegistration> {
    const { providerId } = IoEventsOutputs.provider(
      upstream,
      desired.providerInstanceId,
    ); // typed, no casting
    return this.client.createRegistration({ ...desired, providerId });
  }
  // ...
}

// source/events/commerce-events/provider-resource.ts  (internal)
import { IoEventsOutputs } from "../io-events/outputs.js";

class CommerceEventsProviderResource implements Resource<
  AppConfig,
  CommerceEventProviderConfig,
  CommerceEventProvider
> {
  readonly kind = "commerce-events/provider";
  readonly dependsOn = ["io-events/provider", "commerce-events/setup"] as const;

  async create(
    desired: CommerceEventProviderConfig,
    upstream: UpstreamOutputs,
  ): Promise<CommerceEventProvider> {
    const { providerId } = IoEventsOutputs.provider(
      upstream,
      desired.instanceId,
    );
    return this.commerceClient.createEventProvider({
      ...desired,
      provider_id: providerId,
    });
  }
  // ...
}

// source/events/commerce-events/subscription-resource.ts  (internal)
// One item per Commerce event subscription; depends on commerce-events/provider.
class CommerceEventSubscriptionResource implements Resource<
  AppConfig,
  CommerceEventSubscriptionConfig,
  CommerceEventSubscription
> {
  readonly kind = "commerce-events/subscription";
  readonly dependsOn = ["commerce-events/provider"] as const;
  // ...
}
```

### Running a reconcile

The engine exposes three functions (implemented in a future iteration). The primary workflow is
`plan()` then `apply()` — this lets callers inspect or store the plan before any mutations run,
and enables dry-runs by calling `plan()` alone. `reconcile()` is a convenience wrapper over both.

`plan()` without `apply()` is the iacly equivalent of the existing `/validation` endpoint: it
runs `check()` + `list()` + `diff()` across all providers and returns a reviewable diff with no
mutations. The caller can surface this to the user (or log it) before committing.

The engine receives a list of providers. Each provider's resources receive the full app config
via `check()` and decide what they have to do. If a resource's section is absent from the config,
`check()` returns `[]` and the engine moves on (while still checking the snapshot for orphans).

```ts
const appConfig = await loadConfig(); // full commerce.app.config.ts content

const providers = [
  new IOEventsProvider(ioEventsClient),
  new CommerceEventsProvider(commerceClient, ioEventsClient),
  new WebhooksProvider(webhooksClient),
  new AdminUiProvider(adminUiClient),
];

// Step 1 — build the plan: each resource runs check(config), then list + diff + topo-sort
const currentPlan = await plan(providers, appConfig, {
  previousSnapshot: storedSnapshot,
});

// Inspect the plan before committing — useful for logging or approval gates
console.log(currentPlan.actions);

// Step 2 — apply: executes mutations in resource dependency order, emits progress events
const result = await apply(providers, currentPlan, {
  lock,
  onEvent: async (event) => store.put("progress", event),
});

// Persist the snapshot after every successful apply
await store.put("install-snapshot", result.snapshot);
```

For callers that do not need to inspect the plan, `reconcile()` combines both steps:

```ts
const result = await reconcile(providers, appConfig, {
  previousSnapshot: storedSnapshot,
  lock,
  onEvent: async (e) => store.put("progress", e),
});
```

### Teardown

Teardown is a reconcile with empty desired config and the stored snapshot. The engine uses the
snapshot to know what to delete, regardless of how the current config may have changed:

```ts
const snapshot = await store.get("install-snapshot");

// Pass an empty config — every resource's check() returns [] — combined with the snapshot,
// the engine generates delete actions for all snapshot resources in reverse dependency order.
await reconcile(providers, {} as AppConfig, { previousSnapshot: snapshot });
```

## Design

### Package 1 — `@aio-commerce-sdk/iacly`

Located in `packages-private/iacly/`. Private, no build step, consumed from source within the
workspace. No runtime dependencies.

#### Module structure

```
source/
  provider.ts     — Resource, Provider, DiffResult, ProviderOutputs, UpstreamOutputs
  plan.ts         — PlanAction, Plan
  reconciler.ts   — Lock, ReconcileOptions, ReconcileResult, ReconcileEvent,
                    AppliedSnapshot, ProviderSnapshot, ResourceRecord
  index.ts        — re-exports all public types
```

#### `source/provider.ts`

`DiffResult` is a self-contained discriminated union — each variant carries all the data needed
for apply and for plan inspection without reconstructing engine context. The `delete` variant is
absent: `diff()` is only called when a desired item exists; orphan deletion is engine-generated.

```ts
export type DiffResult<TDesired, TState> =
  | { kind: "noop" }
  | { kind: "create"; desired: TDesired }
  | { kind: "update"; current: TState; desired: TDesired }
  | { kind: "replace"; current: TState; desired: TDesired };
```

`ProviderOutputs` is a named key-value map a resource exposes after apply. `UpstreamOutputs`
collects them all, namespaced by `resource.kind` — clash-free by the global uniqueness invariant
on `kind`. The `provider/resource` kind convention (e.g. `'io-events/provider'`) provides
natural namespacing within a provider.

```ts
export type ProviderOutputs = Record<string, unknown>;
export type UpstreamOutputs = ReadonlyMap<string, ProviderOutputs>;
```

`Resource` is the manageable unit. `TConfig` is the full app config type shared by all resources
in a reconcile call. `check(config)` is called once per resource at the start of `plan()`: it
extracts and validates this resource's desired items from the full config, returning `[]` when
nothing is configured. `keyFromDesired` and `keyFromState` let the engine match desired items to
live state without imposing structural constraints on `TDesired` or `TState`. The `id` parameter
in `update` and `delete` is the config-level key (for identification and logging); resources
access `current` to obtain the system-assigned API identifier for actual mutation calls. `read` is
optional — the engine uses `list()` for its reconcile loop; `read` is available for resources that
support point lookups.

`outputs()` is optional — only resources that expose values consumed by downstream resources need
to implement it. The engine calls it after applying all items for that resource and merges the
result into `UpstreamOutputs` under the resource's `kind`. `create()` and `update()` receive the
accumulated upstream outputs so downstream resources can resolve cross-resource references without
extra API calls.

`Provider` is a named container that groups related resources. It is the composition root: it
takes shared clients in its constructor and wires them into each resource it creates internally.
The engine receives `Provider[]` and flattens their resources for topo-sort and execution.

```ts
export interface Resource<TConfig, TDesired, TState> {
  readonly kind: string; // globally unique; convention: 'provider/resource'
  readonly dependsOn: readonly string[]; // other resource kinds

  check(config: TConfig): Promise<readonly TDesired[]>;
  keyFromDesired(desired: TDesired): string;
  keyFromState(state: TState): string;

  outputs?(states: readonly TState[]): ProviderOutputs;

  list(): Promise<TState[]>;
  read?(id: string): Promise<TState | null>;
  diff(current: TState | null, desired: TDesired): DiffResult<TDesired, TState>;
  create(desired: TDesired, upstream: UpstreamOutputs): Promise<TState>;
  update(
    id: string,
    current: TState,
    desired: TDesired,
    upstream: UpstreamOutputs,
  ): Promise<TState>;
  delete(id: string, current: TState): Promise<void>;
}

export interface Provider<TConfig> {
  readonly name: string;
  readonly resources: readonly Resource<TConfig, unknown, unknown>[];
}
```

#### `source/plan.ts`

`PlanAction` extends `DiffResult`'s four variants with `delete` (engine-generated for resources
present in the live system or snapshot that are absent from desired). Each action carries the
resource kind and item key for serialization, logging, and progress reporting.

```ts
export type PlanAction<TDesired = unknown, TState = unknown> =
  | { kind: "noop"; resource: string; key: string }
  | { kind: "create"; resource: string; key: string; desired: TDesired }
  | {
      kind: "update";
      resource: string;
      key: string;
      current: TState;
      desired: TDesired;
    }
  | {
      kind: "replace";
      resource: string;
      key: string;
      current: TState;
      desired: TDesired;
    }
  | { kind: "delete"; resource: string; key: string; current: TState };

export interface Plan {
  readonly actions: readonly PlanAction[];
  readonly resourceOrder: readonly string[]; // resource kinds in topo-sorted execution order
}
```

#### `source/reconciler.ts`

`Lock` is caller-supplied. The backing store (in-memory, a key-value service, a database row) is
the caller's choice; `iacly` calls acquire/release/forceRelease and enforces the invariant.

```ts
export interface Lock {
  acquire(): Promise<void>;
  release(): Promise<void>;
  forceRelease(): Promise<void>;
}
```

`ResourceOutcome` is the per-resource result of apply. `blocked` carries the kind of the
upstream provider that failed.

```ts
export type ResourceOutcome<TState = unknown> =
  | { status: "created"; state: TState }
  | { status: "updated"; state: TState }
  | { status: "replaced"; state: TState }
  | { status: "deleted" }
  | { status: "noop" }
  | { status: "failed"; error: unknown }
  | { status: "blocked"; blockedBy: string };
```

`AppliedSnapshot` is the persisted record of a reconcile run. It covers all resources — including
those with `failed` or `blocked` outcomes — so teardown has complete information and can decide
per-outcome how to handle each resource. The caller persists this after every reconcile (e.g. in
the installation-details payload or `aio-lib-state`).

```ts
export type ResourceRecord<TDesired = unknown> = {
  readonly key: string;
  readonly desired: TDesired;
  readonly outcome: ResourceOutcome["status"];
};

export type ProviderSnapshot = {
  readonly kind: string;
  readonly resources: readonly ResourceRecord[];
};

export type AppliedSnapshot = {
  readonly id: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly forced: boolean;
  readonly providers: readonly ProviderSnapshot[];
};
```

`ReconcileEvent` covers the full reconcile lifecycle. Callers use `onEvent` to stream or persist
granular progress — essential for long-running App Builder worker actions where status must be
written to a durable store and polled by the trigger.

```ts
export type ReconcileEvent =
  | { type: "plan-ready"; plan: Plan }
  | {
      type: "action-started";
      resource: string;
      key: string;
      kind: PlanAction["kind"];
    }
  | {
      type: "action-completed";
      resource: string;
      key: string;
      outcome: ResourceOutcome;
    }
  | { type: "resource-blocked"; resource: string; blockedBy: string }
  | { type: "reconcile-complete"; result: ReconcileResult };

// Options for the plan step: builds the Plan from desired + live state.
// previousSnapshot drives teardown — when desired is empty and a snapshot is supplied,
// the engine generates delete actions for every resource in the snapshot.
export interface PlanOptions {
  previousSnapshot?: AppliedSnapshot;
}

// Options for the apply step: executes a Plan and returns outcomes.
export interface ApplyOptions {
  lock?: Lock;
  force?: boolean;
  onEvent?: (event: ReconcileEvent) => Promise<void>;
}

// Convenience union for callers that want a single reconcile() call.
export type ReconcileOptions = PlanOptions & ApplyOptions;

export interface ReconcileResult {
  readonly plan: Plan;
  readonly outcomes: ReadonlyMap<string, ResourceOutcome>; // key: `${resourceKind}:${itemKey}`
  readonly snapshot: AppliedSnapshot;
}

// Function signatures — implemented by the engine in a future iteration.
export type PlanFn = <TConfig>(
  providers: readonly Provider<TConfig>[],
  config: TConfig,
  options?: PlanOptions,
) => Promise<Plan>;

export type ApplyFn = (
  providers: readonly Provider<unknown>[],
  plan: Plan,
  options?: ApplyOptions,
) => Promise<ReconcileResult>;

// reconcile() = plan() followed by apply(). Dry-run: call plan() without apply().
export type ReconcileFn = <TConfig>(
  providers: readonly Provider<TConfig>[],
  config: TConfig,
  options?: ReconcileOptions,
) => Promise<ReconcileResult>;
```

---

### Package 2 — `@aio-commerce-sdk/aio-commerce-lib-iacly`

Located in `packages-private/aio-commerce-lib-iacly/`. Private, no build step, consumed from
source within the workspace.

**Dependencies:** `@aio-commerce-sdk/iacly`, `@adobe/aio-commerce-lib-webhooks`,
`@adobe/aio-commerce-lib-events`, `@adobe/aio-commerce-lib-admin-ui`.

#### Source structure

Providers are public (exported, instantiated by the caller). Resource classes are internal to each
provider module. `outputs.ts` files are exported for consumption by resources in other providers.

```
source/
  webhooks/
    resource.ts              — WebhookResource (internal)
    types.ts                 — WebhookConfig, Webhook
    provider.ts              — WebhooksProvider (public)
    index.ts
  events/
    io-events/
      provider-resource.ts        — IoEventsProviderResource (internal)
      event-metadata-resource.ts — IoEventsEventMetadataResource (internal)
      registration-resource.ts   — IoEventsRegistrationResource (internal)
      types.ts               — IoEventProviderConfig, IoEventRegistrationConfig, …
      outputs.ts             — IoEventsOutputs (exported typed accessor)
      provider.ts            — IOEventsProvider (public; handles both Commerce and external sources)
      index.ts
    commerce-events/
      setup-resource.ts      — CommerceEventingSetupResource (internal; singleton)
      provider-resource.ts   — CommerceEventsProviderResource (internal)
      subscription-resource.ts — CommerceEventSubscriptionResource (internal)
      types.ts               — CommerceEventingConfig, CommerceEventProviderConfig, …
      provider.ts            — CommerceEventsProvider (public)
      index.ts
    index.ts
  admin-ui/
    resource.ts              — AdminUiResource (internal)
    types.ts                 — AdminUiConfig, AdminUiExtension
    provider.ts              — AdminUiProvider (public)
    index.ts
  index.ts
```

#### Resource dependency ordering

Dependencies are declared between resource kinds, not providers. The `provider/resource` naming
convention makes cross-provider dependencies readable.

```
io-events/provider           (no deps)    — creates I/O Events provider; exposes providerId map
io-events/event-metadata     dependsOn: ['io-events/provider']
commerce-events/setup        (no deps)    — configures Commerce eventing module (singleton)
webhooks/webhook             (no deps)
admin-ui/extension           (no deps)
io-events/registration       dependsOn: ['io-events/event-metadata']
commerce-events/provider     dependsOn: ['io-events/provider', 'commerce-events/setup']
commerce-events/subscription dependsOn: ['commerce-events/provider']
```

`io-events/provider` is shared: `IOEventsProvider` uses it for both Commerce and external event
sources (the same I/O Events API, different `providerType`). `IOEventsProvider.check()` extracts
all event sources from config regardless of type; `CommerceEventsProvider.check()` extracts only
Commerce-specific sources. External-only configs register `io-events/*` resources only and never
touch `CommerceEventsProvider`.

`io-events/registration` depends on `io-events/event-metadata` (registrations reference event
codes by value; the codes must already exist). `commerce-events/provider` can run in parallel
with `io-events/event-metadata` and `io-events/registration` — it only needs the I/O Events
provider ID, not the metadata or registrations.

For 2 Commerce event sources (each with 1 event and 1 runtime action), the engine executes 9
requests — the independent setups run first in parallel, then dependent resources in topo order:

```
io-events/provider:           createEventProvider()              // × 2, parallel with setup
commerce-events/setup:        updateEventingConfiguration()      // × 1, parallel
io-events/event-metadata:     createEventMetadataForProvider()   // × 2 (one per source)
io-events/registration:       createRegistration()               // × 2 (one per source)
commerce-events/provider:     createEventProvider() (Commerce)   // × 2 (after provider + setup)
commerce-events/subscription: createEventSubscription()          // × 2 (one per event)
```

#### Test structure

Integration tests cover one scenario each, using MSW to mock HTTP calls. Each test exercises the
full reconcile cycle and asserts on the plan, outcomes, and snapshot.

```
test/
  fixtures/
    webhooks.ts             — MSW handlers + fixture responses
    events.ts
    admin-ui.ts
  integration/
    webhooks.test.ts        — 1 webhook: create, update, noop, delete
    events-commerce.test.ts — 1 Commerce event source: all 6 resource kinds exercised
    events-external.test.ts — 1 external event source: only io-events/* resources; no commerce-events/*
    admin-ui.test.ts        — 1 Admin UI extension registration
    combined.test.ts        — all providers together; validates topo-sort, partial failure
                              propagation, and full AppliedSnapshot structure
```

Each integration test follows this pattern:

```ts
it("creates a webhook on first reconcile", async () => {
  // arrange: MSW returns empty list, then successful create
  server.use(...webhookHandlers.emptyList, ...webhookHandlers.create);

  const config: AppConfig = {
    webhooks: [
      {
        code: "order.created",
        url: "https://example.com",
        method: "POST",
        fields: [],
      },
    ],
    // no events key — EventsProvider.check() returns [] and is a no-op
  };

  const result = await reconcile([new WebhooksProvider(client)], config);

  expect(result.plan.actions).toEqual([
    {
      kind: "create",
      resource: "webhooks/webhook",
      key: "order.created",
      desired: expect.any(Object),
    },
  ]);
  expect(result.outcomes.get("webhooks/webhook:order.created")?.status).toBe(
    "created",
  );
  expect(result.snapshot.providers[0].resources[0]).toMatchObject({
    key: "order.created",
    outcome: "created",
  });
});
```

The `combined.test.ts` test additionally asserts that blocked resources appear in the snapshot
with `outcome: 'blocked'`, confirming that the snapshot is a complete record of every declared
resource regardless of whether it was successfully applied.

## Drawbacks

- Adds a new conceptual layer (providers, plans, snapshots) that developers must understand before
  writing any install logic.
- `keyFromDesired` / `keyFromState` require careful implementation per provider — a mismatch
  between the two keys causes silent reconcile failures (resources never matched, perpetually
  re-created).
- Cross-resource references via `outputs()` / `IoEventsOutputs.provider(upstream, instanceId)`
  are a convention, not enforced by the type system. A resource that consumes upstream outputs
  without declaring the corresponding `dependsOn` entry will receive an empty map at runtime with
  no compile-time error.
- The `AppliedSnapshot` must be persisted by the caller after every reconcile. Forgetting to
  persist it (or persisting a partial result after a crash) leaves teardown in the same orphan
  situation we are solving.

## Rationale and alternatives

**Why types-only for the first iteration?** Implementing the reconcile engine before the provider
interface is validated by real implementations risks locking in the wrong shape. The four providers
and eight resource kinds in `aio-commerce-lib-iacly` will surface any interface gaps before the
engine lands.

**Why caller-managed snapshot persistence (Option B) over engine-managed (Option D)?** Option D
would require `iacly` to accept a storage dependency, breaking the "no runtime dependencies"
constraint and tying the library to App Builder's storage model. Option B keeps the library a
pure computation over data; the caller uses whatever store is available
(installation-details payload, `aio-lib-state`, a database row).

**Why include failed/blocked resources in the snapshot?** Excluding them would silently discard
the information that a resource was declared but not applied. Teardown can make a more informed
decision (attempt delete, skip, surface as an error) when it knows the outcome of every declared
resource, not just the successes.

**Why imperative steps remain alongside providers?** Not all install concerns map cleanly to
CRUD resources. Imperative steps that require conditional logic, sequential side effects, or
interactions with non-CRUD APIs are better expressed as code. The install orchestration layer
accepts both as first-class options; neither is deprecated.

## Unresolved questions

- **Topo-sort cycle detection.** `dependsOn` declarations that form a cycle must be detected and
  rejected at registration time. The error message and recovery path are unspecified.
- **`AppliedSnapshot` versioning.** If `ResourceRecord` or `ProviderSnapshot` gains fields in a
  future iteration, stored snapshots from older installs must still deserialize correctly. A
  version field or a migration strategy is needed before the engine lands.
- **Teardown behaviour for `failed`/`blocked` resources.** The engine needs a policy: attempt
  delete (safest), skip, or surface as a warning and let the caller decide. Unresolved until the
  engine is implemented.
- **`replace` semantics per provider.** Which config changes require delete + recreate vs.
  in-place update is provider-specific. Each provider must document this in its `diff`
  implementation. No library-level mechanism enforces it.
- **`check` error granularity.** `check(config)` validates the entire provider section at once.
  If one item is invalid the whole provider fails before `list()` is called. Whether partial
  validation (valid items proceed, invalid items are reported) is ever needed is unresolved.

## Future possibilities

- **Reconcile engine (iteration B).** The types defined here are the complete contract the engine
  implements. Adding the engine is additive — no interface changes expected.
- **Lock interface.** The `Lock` type is defined; a reference implementation backed by
  `aio-lib-state` (with TTL as a safety net for crashed workers) is a natural follow-on.
- **Drift detection.** The `previousSnapshot` passed into `ReconcileOptions` enables comparing
  desired vs. last-applied vs. live — distinguishing intentional config changes from external
  drift. This is not exploited in the initial engine but the data is available.
- **Install orchestration layer.** A higher-level API that accepts a union of `Provider` and
  `ImperativeStep`, sequences them, and manages the snapshot lifecycle end-to-end. This is
  where the install/uninstall runtime actions eventually converge.
- **Per-resource dependency tracking.** The current model blocks an entire provider when any
  upstream provider fails. Finer-grained dependency declarations (resource A depends on resource
  B, not on the whole provider) would reduce unnecessary blocking in large plans.
