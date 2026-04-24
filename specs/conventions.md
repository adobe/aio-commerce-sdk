# Spec Conventions

## Why specs

The RFC process provides a consistent path for substantial changes to the SDK so
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

If in doubt, write a spec. A short spec is better than a surprise.

## Files

Specs live in `specs/features/` and are named with the Jira ticket prefix so
they are easy to find:

```
specs/features/CEXT-6138-capability-discovery.md
```

Use `specs/features/_template.md` as the starting point.
