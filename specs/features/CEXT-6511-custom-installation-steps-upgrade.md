# Custom Installation Steps During Application Upgrade

- **Ticket:** [CEXT-6511](https://jira.corp.adobe.com/browse/CEXT-6511)
- **Created:** 2026-08-12
- [ ] **Implemented**

## Summary

Custom installation steps (`installation.customInstallationSteps`) let a developer run arbitrary
scripts during install and uninstall, each with an `install` handler and an optional `uninstall`
handler. That part already works today. This spec is about the lifecycle operation the SDK is
adding next: upgrade. It lays out three candidate models for what should happen to custom
installation steps when an app upgrades from one version to another.

## Motivation

Some apps need custom logic beyond what the SDK's built-in domains (events, webhooks, admin UI)
cover, like provisioning an external system, seeding data, or registering with a third party.
`defineCustomInstallationStep` exists for exactly that: the developer writes a script, and the SDK
runs it during install (and uninstall, if defined).

Until now an app could only be installed fresh or fully uninstalled. With upgrade orchestration,
apps will move from an already-installed version to a newer one without a full reinstall, and
there's no existing answer for what happens to custom installation steps in that case. It comes
down to three questions: should new steps in the upgraded version run automatically? Should a step
that already ran run again, and under what condition? And if a step is no longer in the config,
should its `uninstall` run, and when?

**Goals:**

- A single, documented behavior for what happens to custom installation steps during an app
  upgrade, that developers can rely on when authoring scripts.

**Non-goals:**

- Any changes in UI.

## Developer experience

All three models keep the same authoring API. `defineCustomInstallationStep` takes either an
`{ install, uninstall }` object, or a plain async function that only covers `install`:

```ts
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";

// Object form: install and (optionally) uninstall. This is the best practice.
export default defineCustomInstallationStep({
  install: async (config, context) => {
    context.logger.info("Setting up...");
    return { status: "success" };
  },
  uninstall: async (config, context) => {
    context.logger.info("Tearing down...");
  },
});

// Function form: install only. Since there's no uninstall handler to call, this step is
export default defineCustomInstallationStep(async (config, context) => {
  context.logger.info("Setting up...");
  return { status: "success" };
});
```

and the same config shape in `app.commerce.config.json`:

```ts
installation: {
  customInstallationSteps: [
    { name: "Configure Webhooks", description: "...", script: "./scripts/configure-webhooks.js" },
    { name: "Initialize Database", description: "...", script: "./scripts/initialize-database.js" },
  ],
},
```

Where the three models actually differ is in what they ask of the developer's script, and in what
happens to a step across versions once it's added, kept, or removed. That's what each option below
covers.

Two recommendations apply regardless of which option is chosen, and are documentation-only, not
part of the design itself:

- Use the object form (`{ install, uninstall }`), not the plain function form. This isn't
  functionally required, but a step with no `uninstall` can't be cleaned up later.
- Don't remove a custom installation step's script from the project, at least not one that has an
  `uninstall`. Once the file is gone, there's nothing left to run when uninstall/unassociate needs
  it (see the related unresolved question below).

## Design

### Option A: Idempotent scripts, re-run everything

Every step's `install` runs on every upgrade, unconditionally, the same set that would run on a
fresh install, every time. No config changes needed. The only real requirement is that `install`
has to be safe to call more than once (create-if-not-exists, not create-unconditionally). A removed
step isn't touched by this: nothing runs its `uninstall` outside of a full app uninstall today, and
this model doesn't change that. No new persisted state either.

### Option B: Per-step version field

Each step gets a `version` field, and the SDK keeps track, per step name, of the version it last ran
successfully. On upgrade, a step's `install` only runs if its declared version is newer than what's
persisted (or the step is new). A fresh install still runs every step once, at its current version.

```ts
customInstallationSteps: [
  {
    script: "./scripts/configure-webhooks.js",
    name: "Configure Webhooks",
    description: "Set up webhook endpoints for order notifications",
    version: "1.1.0",
  },
  {
    script: "./scripts/initialize-database.js",
    name: "Initialize Database",
    description: "Create required database tables and indexes",
    version: "1.0.0",
  },
],
```

This adds a required field per step, and asks developers to bump `version` whenever the logic
changes in a way that needs to re-run. The SDK can't verify that, it only compares against
the last persisted value. Removed steps behave the same as in Option A. The extra state needed is
the last-run version per step name.

### Option C: Migration-style steps (append-only)

Steps behave like database migrations: identified by `name`, run once, and never edited in place. A
step's `install` runs the first time its name shows up in an installed app's history. If a step
disappears from the config, nothing happens during that upgrade. It isn't retroactively undone.
`uninstall` isn't tied to a step disappearing from config at all: it only runs as part of a full
unassociate, where every step that ever ran (whether or not it's still in the current config) gets
its `uninstall` called.

No config changes here either. The rule for developers is: don't edit an existing step in place, add
a new one instead if the behavior needs to change. The SDK needs to persist which step names have
ever run, plus enough identity per historical step (name and script path) to resolve and call
`uninstall` later, at unassociate time.

We prototyped the add/retain side of this (a `plan`/`apply` pair that diffs the target config's
steps against a persisted "already executed" set, by name) and confirmed it's implementable on top
of the SDK's existing upgrade orchestration. The prototype didn't implement the unassociate-only
`uninstall` timing described above; that refinement came out of this discussion, so it's worth
flagging as a difference from what was actually tested.

## Drawbacks

**Common to all three:** none of them let the SDK verify what a script actually does. Whichever we
pick, the developer follows a documented contract, and the SDK only enforces the mechanical part:
whether and when a step re-runs.

**Option A:**

- You can't retroactively demand idempotency from scripts that already exist. An app that wasn't
  written that way has no easy fix short of a rewrite.
- The upgrade plan would list every custom step, every time, whether or not anything changed. Not
  great for a merchant trying to understand what an upgrade will actually do.

**Option B:**

- A new, permanent field every author has to remember to maintain.
- Version bumps are self-reported and unverifiable: forget to bump it and a step silently skips;
  bump it by mistake and it re-runs for no reason.
- A step only has one script body at a time. If 1.0.0 and 1.1.0 are meant to be two separate
  actions, not 1.1.0 replacing 1.0.0 outright, there's no way to express that in a single versioned
  file. A fresh install only ever runs whatever the current file contains, once. Getting this right
  means the same idempotency discipline as Option A, just scoped to "since the last version bump"
  instead of "always."

**Option C:**

- Renaming a step (same script, new name) looks identical to removing one and adding another: the
  old one's `uninstall` waits for unassociate, the new one runs from scratch. Probably not what
  someone renaming a step actually wants.
- Fixing a bug in a step that already ran means adding a whole new step to carry the fix, not
  correcting the original in place. A bit heavy for a small fix, though it's the same trade-off any
  migration system makes.
- Cleanup for a removed step is deferred until unassociate, not immediate. Could surprise a
  developer expecting it to clean up right away.

## Unresolved questions

- Which of the three options should the SDK implement? This is a product call (Dani), not just a
  technical one: A/B/C each put a different burden on third-party developers, so it's as much a
  developer-experience and support-cost question as an engineering one.
- If we go with B: should `version` be a free-form string (semver-ish, as shown above), or something
  more constrained, like an integer sequence?
- If we go with C: should the SDK detect and warn when a step's `script` path changes while its
  `name` stays the same (the rename case above), even if it can't prevent it?
- If we go with C: unassociate has to resolve and call `uninstall` for every step that ever ran,
  including ones removed from the config a long time ago. If the step's `script` file is gone too by
  then, is that an error, or do we just skip it? Throwing doesn't seem right. The script's gone for
  good, there's nothing to recover, and failing unassociate over it just blocks the developer with
  no way out.
