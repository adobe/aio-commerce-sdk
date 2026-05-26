# Node.js Version Support Policy

- **Ticket:** [CEXT-6221](https://jira.corp.adobe.com/browse/CEXT-6221)
- **Created:** 2026-05-11
- [x] **Implemented**

## Summary

This spec defines when the SDK adds support for new Node.js versions and when it
drops support for versions that have reached end-of-life (EOL). The goal is a
standing, documented policy that makes version transitions proactive and
predictable for both maintainers and SDK consumers.

## Motivation

The SDK has no documented policy for Node.js version lifecycle management. This
became a concrete problem in May 2026, when `pnpm@11`, `lint-staged@17`, and
`tsdown@0.22.0` all dropped Node 20 support at roughly the same time — shortly
after Node 20's April 2026 EOL. The result was three Renovate PRs blocked
simultaneously (#431, #433, #434) and a reactive drop-Node-20 PR (#345) created
under time pressure rather than as a planned step.

Without a policy, version transitions are driven by dependency pressure instead
of a deliberate schedule. This makes it harder to coordinate communication to
consumers, harder to decide what semver bump applies, and harder to plan
surrounding work (CI changes, `engines` updates, changelests).

**Goals:**

- Define clear trigger points for adding and dropping Node.js versions.
- Specify the semver bump and consumer communication for each transition.
- Establish a CI matrix rule that follows directly from the policy.

**Non-goals:**

- Specifying a deprecation-warning mechanism in SDK code — the `engines` field
  and changelog are sufficient.

## Developer experience

SDK consumers will see Node.js version changes communicated consistently:

- **Dropping a version**: a `minor` release (see [Rationale](#rationale-and-alternatives)
  for why not `major`) with a changelog entry such as "Drop Node 20 support
  (EOL April 2026)". The new lower bound appears in `engines.node`. Consumers
  still on the dropped version will see pnpm/npm engine warnings on install.
- **Adding a version**: a `minor` release noting that the SDK now officially
  supports the new LTS version. No action required from consumers.

Consumers who pin to the published `engines` range can use it to gate their own
CI matrix decisions.

The supported Node.js version range and the lifecycle policy will be documented
in the user-facing README so that consumers have a single, stable place to check
what versions are supported and when to expect changes, referencing the final
spec to get additional context.

## Design

### Node.js release schedule

Under the current model (through Node 26), Node.js releases a new even-numbered
version every April. That version becomes Active LTS in October of the same year
and reaches EOL approximately 30 months after entering LTS (36 months after
initial release). Odd-numbered versions are short-lived (Current only, ~6 months)
and never become LTS.

**Note:** Starting with Node 27, the release model is
[changing](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule).
There will be one release per year (stable in April, LTS in October), every
release will become LTS, and a new Alpha channel will replace the experimental
role of odd-numbered releases. Node 26 is the last release under the current
odd/even model. The policy rules in this spec (add at LTS entry, drop at EOL)
remain valid under the new model; only the "even year" framing becomes
irrelevant from Node 27 onwards.

Current schedule (as of spec creation):

| Version | LTS start    | EOL        |
| ------- | ------------ | ---------- |
| 20      | October 2023 | April 2026 |
| 22      | October 2024 | April 2027 |
| 24      | October 2025 | April 2028 |
| 26      | October 2026 | April 2029 |

### Adding support for a new version

Add a Node.js version to the SDK's supported range **when it enters Active LTS**
(October each year).

- Add it to the CI matrix.
- Raise the upper bound of `engines.node` to include the new version.
- Release as a `minor` bump.

### Dropping support for an EOL version

Drop a Node.js version **in a dedicated standalone release after its EOL date**.
The drop must not be bundled with unrelated changes.

- Remove it from the CI matrix.
- Raise the lower bound of `engines.node` to exclude the dropped version.
- Release as a `minor` bump.
- Include a user-facing changeset entry, e.g.
  _"Drop Node 20 support (EOL April 2026)"_.

### CI matrix rule

The CI matrix must cover **all Active LTS Node.js versions** at all times. No
more, no less.

### Semver reference

| Transition                          | Bump  |
| ----------------------------------- | ----- |
| Adding support for a new version    | minor |
| Dropping support for an EOL version | minor |

Both transitions affect the runtime constraint (`engines.node`) but not the
public API surface, which is why `major` is not warranted.

## Drawbacks

- **Release overhead**: each EOL drop requires its own dedicated release, which
  adds a small process cost even when the only change is removing a Node version
  from the matrix.
- **Consumer impact**: consumers on an EOL Node version will be broken by the
  next `minor` release. Some projects treat this as `major`. This spec
  deliberately chooses `minor` to align with broad ecosystem convention (Sindre
  Sorhus, many popular npm packages) and because the API surface is unchanged.

## Rationale and alternatives

**Why drop at EOL rather than waiting for a dependency to force it?**
Waiting is the current (undocumented) practice and is what caused the May 2026
incident. Dropping proactively at EOL means the transition is planned, communicated,
and not bundled with unrelated dependency updates.

**Why add at LTS entry rather than at release?**
The April release (Current phase) is too early: tooling support, type
definitions, and the broader ecosystem often lag by months. LTS entry in October
is the conventional signal that a version is production-ready. Our own toolchain
(tsdown, pnpm, lint-staged) consistently targets LTS versions. This also keeps
the SDK's supported range aligned with the Node.js LTS versions available in
[App Builder runtime](https://github.com/AdobeDocs/app-builder/blob/main/src/pages/guides/runtime_guides/reference_docs/runtimes.md),
which is the primary deployment target for SDK consumers. Note that the runtime
retains EOL versions longer than this policy does — the alignment is on which
LTS versions are supported, not on the EOL drop schedule.

**Alternative: grace period (e.g. drop 3 months after EOL)**
A fixed grace period adds complexity without proportional benefit. The "first
regular release after EOL" rule naturally provides a grace period tied to the
release cadence, without requiring a separate timer.

**Alternative: treat Node drops as `major`**
Some projects do this (notably the Node.js project itself). For an SDK whose
public API is unchanged, the overhead of a major version bump — consumer lock-in,
dependency resolution complications — outweighs the benefit of the signal. A
`minor` bump with a clear changelog entry is sufficient.

## Unresolved questions

Nothing relevant.

## Future possibilities

- Automate an issue/PR reminder (e.g. via Renovate or a GitHub Action) when a
  supported Node version is within 60 days of EOL.
