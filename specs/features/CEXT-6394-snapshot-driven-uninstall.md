# Snapshot-Driven Uninstall

- **Ticket:** [CEXT-6394](https://jira.corp.adobe.com/browse/CEXT-6394)
- **Created:** 2026-06-19
- [x] **Implemented**

## Summary

App uninstallation currently derives what to remove from the _current_ app config at
uninstall time. If the config drifted between install and uninstall, resources that were
actually created are no longer reflected in the config and are silently orphaned. This spec
makes the installed config part of the persisted state, and drives uninstallation from that
record instead of from the current config.

## Motivation

`@adobe/aio-commerce-lib-app` installs external resources (Commerce webhook subscriptions,
Adobe I/O Events providers/metadata/registrations, Commerce eventing subscriptions, Admin UI
extensions) by walking a step tree built from the app config. Each leaf step's `install`
handler returns a result that is stored in the installation state's `data` payload, keyed by
the step path. The final `SucceededInstallationState` is persisted.

Uninstallation reuses the same machinery but in reverse: it builds an uninstall step tree
from the config supplied on the uninstall request and calls each step's `uninstall` handler.
Two facts combine into a defect:

1. The persisted installation state records `id`, `step`, and `data`, but **not the config
   that was installed**. There is no authoritative record of what was applied — only what the
   current config says should exist.
2. The uninstall execution endpoint never loads the persisted installation snapshot. It runs
   the uninstall workflow against the config from the current request.

As a result, when the config changes between install and uninstall — a resource is removed
from config, an app is redeployed with a different config, or a step's `when` condition no
longer matches — the corresponding uninstall step is filtered out or iterates the wrong items.
The originally-created resource is never deleted and is orphaned in Commerce / I/O Events.

This is the single highest-value gap in the current lifecycle: uninstall is supposed to leave
the environment clean, and today it cannot guarantee that under drift.

### Goals

- Uninstallation removes exactly the resources that were created at install time, regardless
  of how the current config has since changed.
- The persisted installation state records the installed config alongside the existing per-step
  results, making it a self-contained snapshot.
- The change is contained to `aio-commerce-lib-app`, additive, and backward-compatible with
  installation states persisted before this change.

### Non-goals

- A general declarative reconcile/diff engine. This spec deliberately reuses the existing
  step/runner model.
- Drift _detection_ or reporting (telling the operator that live resources diverged from the
  snapshot). This spec only ensures correct teardown.
- Changing the public shape of the uninstall request, or the set of resources the SDK manages.

## Developer experience

For app developers the behavior simply becomes correct; the public request contract is
unchanged. The observable differences:

- **Uninstall is drift-proof.** After installing an app and later changing or redeploying its
  config, triggering uninstall removes the resources that were actually created — not the ones
  the latest config happens to describe.
- **The installation status payload is richer.** The state returned by the installation and
  uninstallation status endpoints now includes the `config` that was applied, alongside the
  existing `step` tree and `data`. Consumers reading the state see an authoritative snapshot of
  what the app installed.
- **Legacy installs degrade gracefully.** If an app was installed before this change (its
  persisted state has no recorded config), uninstall falls back to the current request config —
  exactly today's behavior — so nothing regresses for in-flight installations.

Concretely, the only API-surface change is an optional `config` on the state that the status
endpoints return. All installation states extend a shared base, so the field appears on the
in-progress, succeeded, and failed states alike:

```ts
// Before
type InstallationStateBase = {
  id: string;
  step: StepStatus;
  data: InstallationData | null;
};

// After
type InstallationStateBase = {
  id: string;
  step: StepStatus;
  data: InstallationData | null;

  /** The config that was applied. Absent on records persisted before this change. */
  config?: CommerceAppConfigOutputModel;
};
```

Because `config` is optional, consumers that read the state must treat it as possibly absent
(legacy records); new installs always populate it.

No new config keys, CLI flags, or required parameters are introduced. A developer authoring a
custom installation step gains an optional capability (described in Design) but is not required
to change anything.

## Design

The fix has two parts: recording the snapshot, and sourcing uninstall from it. Together they
close the defect.

### Part 1 — Record the installed config on the state

The installation state gains the config it was built from. Because states persisted before this
change will not have it, the field is optional on read; new installs always populate it.

- The shared state base carries an optional `config` (the validated
  `CommerceAppConfigOutputModel`).
- The initial-state factory already receives the config; after this change it will stamp it onto
  the state so it flows through in-progress, succeeded, and failed states without extra plumbing.
- The succeeded/failed state factories carry `config` through from the base, and the retry-state
  factory carries it through from the failed state it resumes.

The config is stored verbatim — the full validated config — so the snapshot is a faithful record
with no information loss; teardown never has to guess at fields that were trimmed.

The result: a persisted `SucceededInstallationState` (and `FailedInstallationState`, for
partial-install cleanup) is a self-contained snapshot — installed `config` + per-step `data`
(already collected during installation) + the `step` tree.

### Part 2 — Drive uninstall from the snapshot

When an uninstall starts, the SDK loads the persisted installation snapshot and uses it as the
source of truth:

- The uninstall start endpoint loads the persisted installation state from the installation
  store. When a completed snapshot exists and its `config` is present, that config becomes the
  config the uninstall step tree is built from.
- When no completed snapshot with a recorded config exists (legacy installs, an in-progress
  install, or the install record was cleared), uninstall falls back to the current request
  config — preserving today's best-effort behavior.
- The resolved config is threaded through the existing async invocation to the uninstall
  execution endpoint, which already accepts an `initialState` and a config; no new transport
  is introduced.

This is sufficient to fix the defect: the uninstall tree is rebuilt from the _installed_ config,
so no installed step is filtered out, and handlers iterate the items that were actually created.
Resources identified by deterministic keys (webhook batch/hook names, I/O Events `instance_id`
derived from metadata + provider + workspace) regenerate to the same identifiers they had at
install time, so the existing handlers find and delete them.

### Edge cases

- **No snapshot at uninstall.** Fall back to the current request config (today's behavior).
  Documented as best-effort.
- **Failed install, then uninstall.** The failed state also records `config`, so cleanup of a
  partially-installed app is driven by the same snapshot.
- **Environment consistency.** A snapshot installed against one Commerce environment must drive
  deletions against that same environment. The uninstall request already supplies the Commerce
  connection; the snapshot only changes _which resources_ are targeted, not _where_. This is
  called out so implementers do not source credentials from the snapshot.
- **Snapshot availability.** The combined store persists completed states; a succeeded install
  is durable before an uninstall can read it.

### Interactions with existing SDK features

The change is internal to `aio-commerce-lib-app`. It reuses `lib-config` validation
(`validateCommerceAppConfig`) for the snapshot config and the existing combined state store. The
managed resources (`lib-webhooks`, `lib-events`, Admin UI) are unaffected; only the source of the
items their handlers iterate changes. The state shape is part of the runtime action contract, so
`docs/openapi.json` and its `info.version` receive a minor bump (the change is additive), and a
minor changeset accompanies the change.

## Drawbacks

- The persisted state grows: it now embeds the full installed config. For large configs this
  increases the stored payload, though it remains small relative to action limits.
- The installation state type — exported and surfaced by the status endpoints — gains a field.
  Even though it is additive, it is a visible contract change consumers may need to account for.
- Two notions of "config" exist transiently during uninstall (the request config and the
  snapshot config). The fallback path must be unambiguous to avoid confusion.

## Rationale and alternatives

- **Why record the config rather than a resource-level snapshot?** Storing the installed config
  reuses every existing handler unchanged — they already operate off config — making this the
  lowest-risk path to a correct teardown. A resource-level snapshot is cleaner long-term but
  requires reimplementing each handler against a new shape.
- **Why not solve it with a declarative reconcile engine now?** Such an engine does not yet exist
  and would introduce a second installation model. This spec fixes the highest-value defect
  within the current model at a fraction of the cost, and the recorded snapshot is a stepping
  stone toward any future engine.
- **Could this be solved in user-space?** No. The persisted state and the uninstall workflow are
  internal to the SDK; consumers cannot influence what uninstall iterates.
- **Impact of not doing this.** Uninstall keeps orphaning resources under drift, leaving Commerce
  and I/O Events environments in an inconsistent state that requires manual cleanup.

## Unresolved questions

- None.

## Future possibilities

- **Seed uninstall state from the install-time data.** The persisted snapshot already carries
  `data` collected during installation. A follow-up could forward that data as the initial
  `data` of the uninstall workflow, and then pass each `uninstall` handler the result its own
  `install` produced for that step path, so handlers can delete by recorded identifiers and
  fall back to config-derived matching. This is additive and backward-compatible — handlers
  that don't use the parameter are unaffected — and is not required to close the defect.
- The recorded snapshot is the artifact a future declarative reconcile engine would consume for
  snapshot-driven teardown; this work de-risks that direction by proving the snapshot round-trips.
- A future status endpoint could diff the recorded snapshot against live resources to surface
  drift to operators (drift detection), building on the record this spec introduces.
