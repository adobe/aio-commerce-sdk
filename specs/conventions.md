# Spec Conventions

## Why specs

The spec process provides a consistent path for substantial changes to the SDK so
that all stakeholders can be confident about its direction.

Many changes — bug fixes, internal refactoring, documentation improvements — can
go straight to a pull request. But some changes are substantial enough to warrant
a design process and explicit alignment before implementation begins.

## When to write a spec

Write a spec when the change is "substantial". This includes:

- New public API surface (new exports, new config fields, new lifecycle hooks)
- Changes to existing public API that affect SDK consumers
- New SDK-level features that span multiple packages
- Removal of existing public API

A spec is not required for:

- Bug fixes with no API surface change
- Internal refactoring that doesn't affect SDK consumers
- Test or documentation additions
- Dependency updates

If in doubt, write a spec. A short spec is better than a surprise. A spec
should be detailed enough to align on the design and unblock implementation,
but not so detailed that it describes code — leave implementation choices to
the implementor.

A spec is not a living document. It represents the design agreed upon at the
time the spec PR was merged. If a subsequent ticket changes the design, it
produces a new spec file — the original remains unchanged as a record of what
was decided and why. This avoids spec drift: the spec always reflects the
intent at the time it was written, not whatever was eventually built.

## Files

Specs live in `specs/features/` and are named with the Jira ticket prefix so
they are easy to find:

```
specs/features/CEXT-6138-capability-discovery.md
```

Use `specs/features/_template.md` as the starting point.

Spec files are auto-formatted by Prettier on every commit (via lint-staged) and
by `pnpm format:markdown`. Focus on content — don't worry about line wrapping or
whitespace.

## Workflow

A feature goes through two pull requests:

1. **Spec PR** — contains only the spec file. Reviewers align on the design
   before any implementation begins. Once merged, the spec is considered
   approved and the feature is ready to implement.
2. **Implementation PR** — contains the code. References the approved spec.
   Once merged, the spec status is updated to _Implemented_.

This separation ensures design decisions are made explicitly and are not
shaped retroactively by implementation details.

### Status

A spec has no explicit status until it is implemented. The repo state is the
source of truth:

- **Spec PR open** — the spec is under review.
- **Spec PR merged** — the spec is approved and implementation can begin.
- **Implementation PR merged** — check the `Implemented` box in the spec
  metadata as part of the implementation PR. This is the only status transition
  that requires an explicit change.
