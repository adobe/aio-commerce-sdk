# Configuration history and selective restore

- **Ticket:** [CEXT-6076](https://jira.corp.adobe.com/browse/CEXT-6076)
- **Created:** 2026-11-09
- [ ] **Implemented**

## Summary

Record scope-local configuration writes and expose paginated history and selective
restoration through the configuration library and generated App Management action.
This ports the feature proposed in PR #283 to the current SDK architecture.

## Motivation

Developers need to inspect changed settings and recover selected historical values
without overwriting unrelated current configuration. Existing configuration
storage does not retain historical writes.

Goals are typed snapshots, password-safe history, explicit storage failures, and
restoration that preserves scope inheritance. Non-goals are distributed
transactions, automatic retention, user attribution, system-config history, and
changes to existing scope selector behavior.

## Developer experience

After normal schema initialization:

```typescript
const history = await getConfigurationVersions(byScopeId(scopeId), {
  limit: 20,
});
await restoreConfigurationVersion(
  byScopeId(scopeId),
  {
    versionId,
    fields: ["enabled"],
    expectedLatestVersionId: history.versions[0].id,
  },
  { encryptionKey },
);
```

The generated action adds `GET /config/versions` and
`POST /config/versions/restore`, both using `scopeId`. History and restore results
mask password fields. Restore defaults to the keys changed by the source version,
not the entire historical state. Explicit field subsets may include keys absent
from the snapshot, which removes their current overrides.

## Design

Immutable UUIDv7 records retain encrypted scope-local snapshots and before/after
changes. Records live under a scope-ID namespace, without a mutable shared index.
The authoritative configuration file is read before writes; state caching retains
the existing regional invalidation strategy. A failed history write does not
revert configuration and reports `VERSION_WRITE_FAILED`.

Library paging and HTTP schemas validate integer limits from 1 to 200 and
non-negative safe-integer offsets. Restore validates record shape, scope,
current field types, list options, and encryption keys before persisting.
A latest-version mismatch fails before mutation with `VERSION_CONFLICT`; the
HTTP route returns 409. This check is not atomic across distributed writers.
Missing versions return 404; malformed HTTP inputs return 400.

History starts with new writes. No existing records or obsolete generated
templates from the original PR need migration. Existing configuration APIs,
Commerce-ID selectors, dynamic schemas, typed values, and unset semantics remain.
Code-only selectors on the new history APIs must identify a unique scope.

## Drawbacks

Writes require an additional file operation and retain encrypted secret history.
Listing costs grow with the number of records. A successful configuration write
can be followed by a failed history write, so clients must inspect state before
retrying.

## Rationale and alternatives

- Port to current routing and persistence instead of replaying obsolete templates.
- Keep runtime value types rather than coercing booleans and arrays to strings.
- Use immutable records instead of an index vulnerable to lost concurrent updates.
- Surface storage failures rather than returning misleading empty history.
- Do not change existing selector behavior as part of this additive feature.

## Unresolved questions

- This local port still needs design approval through the repository's spec process.
- Are advisory latest-version checks and non-transactional history acceptable for
  the initial release, or is a transactional storage design required first?
- What retention policy and maximum history size should a later release support?
- Live configuration remains keyed by scope code under the existing storage
  contract; changing that layout is outside this feature.

## Future possibilities

Retention, author metadata, transaction-backed concurrency control, and durable
reconciliation of writes whose history recording failed.
