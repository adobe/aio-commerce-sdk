# `iacly` — Architecture

## What this is

`iacly` is a lightweight, dependency-free TypeScript library that brings the core ideas of Infrastructure-as-Code to environments where full IaC tooling cannot run. It is intentionally smaller in scope than tools like Terraform or Pulumi: no engine binary, no state backend, no plugin ecosystem. What it does provide is the reconcile loop — the part of IaC that matters most for managing long-lived remote resources from application code.

The intended audience is TypeScript applications that need to manage a set of external resources declaratively, where:

- The desired state is declared in configuration, not imperative code.
- The live state can drift from the declared state (manual changes, partial failures, version upgrades).
- Resources have dependencies on each other and must be created, updated, and deleted in order.
- The environment prohibits running an external engine (serverless functions, edge workers, constrained CI steps).

**Adobe Commerce apps on App Builder are the motivating use case.** They drive the initial design. But nothing in the library is Commerce-specific: providers for I/O Events, Commerce webhooks, or any other system are implemented outside this package and depend on it — not the other way around.

---

## The problem this solves

Standard IaC tools (Terraform, OpenTofu, and similar) require:

- A long-running engine process or binary.
- A durable state backend (local filesystem or remote).
- The ability to install and exec arbitrary tooling.

These assumptions break in constrained runtimes. A serverless function, for example, is a short-lived Node.js process with no persistent filesystem, no ability to exec binaries, and a strict bundle-size ceiling. The engine and state model of standard IaC tools have nowhere to live.

The result is that teams writing application-layer orchestration logic end up reimplementing fragments of the reconcile loop by hand — blind re-creates, no drift detection, no ordering, no partial-failure handling — and paying for it in reliability and complexity over time.

`iacly` fills the gap: a reconcile loop small enough to ship as a dependency, with no runtime requirements beyond Node.js.

---

## The reconcile model

The library is built around five primitives, applied per resource type:

| Primitive       | Responsibility                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **read / list** | Query the live system for the current state of a resource or the full set of owned resources.                             |
| **diff**        | Compare desired vs. current and classify the change: no-op, in-place update, replacement, create, or delete.              |
| **plan**        | Produce an ordered, reviewable set of actions before anything is mutated.                                                 |
| **apply**       | Execute creates, updates, and deletes with dependency ordering and error handling.                                        |
| **state**       | Know which resources this application "owns" so that resources removed from config are also removed from the live system. |

The reconcile cycle is: **load desired state → read current state → diff → plan → apply**.

### Desired state

The caller supplies a declaration of what should exist. The library validates and normalises it before diffing.

### Current state via live discovery

Rather than storing a state file, `iacly` defaults to discovering current state by reading it fresh from the source system on every reconcile. This requires that every created resource carries a discoverable owner marker (a naming convention, a tag, or a stable id derived from config). The payoff is self-healing behaviour: a half-finished apply converges on the next run without any state repair step.

A stored manifest (persisted by the caller in whatever store is available) is supported as a fallback for resource types that cannot be reliably discovered from the live system.

### Dependency ordering

Providers declare their dependencies on other providers. The reconciler topo-sorts from those declarations. Creates and updates run in topological order; deletes run in reverse. This is a data-driven declaration — adding a new resource type does not require changing the reconciler.

### Partial failure semantics

If a resource in an upstream provider fails, downstream providers that depend on it are skipped and reported as blocked. Conservative, but predictable. Per-resource dependency tracking is a possible future extension.

### Concurrency

The reconciler guarantees that at most one reconciliation cycle runs at a time for a given target. Starting a new cycle while one is already in progress is an error by default. The library exposes a `force` option that allows the caller to override a running or stuck cycle — useful when a previous run hung and left the lock held. The caller supplies the locking mechanism (an object implementing a simple acquire/release/force interface); `iacly` calls it and enforces the invariant.

This is a core library concern, not platform-specific. The backing store for the lock (in-memory, a key-value service, a database row) is the caller's choice.

---

## Provider contract

Each resource type is managed by a **provider** — an object that implements the reconciler's contract for a single kind of resource. The contract maps directly onto the five primitives:

```ts
// Sketch — types are not yet defined in source; this captures design intent only.
interface ResourceProvider<TDesired, TState> {
  readonly kind: string;
  readonly dependsOn: readonly string[];

  check(desired: TDesired): Promise<TDesired>;
  list(): Promise<TState[]>;
  read(id: string): Promise<TState | null>;
  diff(current: TState | null, desired: TDesired): DiffResult;
  create(desired: TDesired): Promise<TState>;
  update(id: string, current: TState, desired: TDesired): Promise<TState>;
  delete(id: string, current: TState): Promise<void>;
}
```

This interface is the extension point. Callers implement one provider per resource type and register them with the reconciler. The reconciler owns ordering, progress tracking, and error handling; providers own the API calls.

---

## Design constraints

**No runtime dependencies.** The library itself must not pull in provider-specific SDKs, HTTP clients, or platform libraries. Those belong in the providers, not the engine.

**Tree-shakeable.** Each logical unit of the library is a separate export. Callers that only use the diff or plan step do not pay for the apply machinery.

**Runs anywhere Node.js runs.** No filesystem access, no process spawning, no platform-specific APIs. The library is a pure computation over data; side effects live entirely in the provider implementations.

**Small.** The bundle must remain small enough to fit inside environments with strict size ceilings (e.g. serverless function bundles). This means resisting the pull to add features that belong in providers or in caller-specific orchestration code.

---

## App Builder use case

Adobe App Builder runtime actions are serverless Node.js functions. They have:

- A hard 60-second limit for synchronous (web) actions.
- Up to 180 minutes for asynchronous (non-blocking) actions.
- No persistent local filesystem between invocations.
- A bundle-size ceiling that rules out shipping engine binaries.

The recommended pattern for long-running reconciles in this environment is a trigger/worker split: a synchronous web action validates the request and dispatches a non-blocking worker; the worker runs the full reconcile cycle and writes structured progress to a durable store (e.g. `aio-lib-state`) keyed by activation id. The caller polls that store for status.

`iacly` is designed to run inside the worker. It produces a plan synchronously from desired and current state, then applies it with progress callbacks the worker uses to persist status. Nothing in the library assumes how or where progress is stored — that is the caller's responsibility.

In this environment the lock backing store is typically a durable key-value service (e.g. `aio-lib-state`), with a TTL set slightly longer than the maximum worker duration as a safety net for crashed workers. The `force` option is the escape hatch when a worker is killed before it can release the lock.

---

## Open questions

These are unresolved design questions that must be answered during implementation:

- **Reliable ownership tagging.** Live discovery only works if every created resource carries a discoverable owner marker. Before implementing each provider, confirm that the target API supports a tag, label, or naming convention the library fully controls. If not, a stored manifest is required for that resource type.
- **Idempotency of underlying APIs.** Re-running `create` must not produce duplicates. Verify each API's behaviour on repeat calls and what stable identifier to use as the resource key.
- **Replacement semantics.** Determine which config changes can be applied in place (update) vs. require delete + recreate (e.g. immutable fields). This determines how `diff` classifies changes for each resource type.
- **Progress / state store limits.** Confirm that the chosen store (e.g. `aio-lib-state`) supports the key count, value size, and TTL required for a worst-case plan with many resources.
- **Lock interface design.** The caller-supplied lock must support acquire, release, and force-release. The exact interface (and whether it should support lease extension for long-running applies) is unresolved.
