# Configuration history and tamper-evident audit

- **Ticket:** [CEXT-6076](https://jira.corp.adobe.com/browse/CEXT-6076)
- **Created:** 2026-11-09
- [ ] **Implemented**

## Summary

Port the configuration versioning and audit feature from PR #180 onto the current SDK:
redacted scope-local snapshots, diffs, read-only comparisons, retention, archives, and
per-scope audit hash verification. This local implementation accompanies the proposal;
it does not indicate that a separate spec review or release approval has occurred.

## Motivation

A merchant changes an integration setting and storefront requests begin failing. Today a
support operator can read the current value but cannot identify its previous value, determine
which application actor changed it. Operators need a bounded, read-only history for comparison
and a durable account of configuration writes.

Goals: preserve typed values, origins, scope selection, encryption, inheritance, and current
cache invalidation; retain redacted history; make integrity failures and partial writes explicit.
Non-goals: configuration rollback, applying historical snapshots across application or schema
versions, credential backups, regulatory certification, atomic distributed transactions,
distributed locking, automatic audit deletion, new generated HTTP routes, or an Admin UI.

## Developer experience

`setConfiguration` accepts optional `metadata.actor` and returns `versionInfo`.
`getConfigurationHistory`, `getVersionById`, `getVersionComparison`, and `compareVersions`
inspect retained snapshots by scope code. `getAuditLog` queries one scope or all scopes and
filters actor, action, dates, and pagination.

```typescript
const history = await getConfigurationHistory("global", { limit: 10 });
if (history.versions.length > 1) {
  const comparison = await compareVersions(
    "global",
    history.versions[1].id,
    history.versions[0].id,
  );
}
const audit = await getAuditLog({ scopeCode: "global" });
const verification = await verifyAuditChain("global", externallyStoredHeadHash);
```

History APIs inspect snapshots and diffs without changing live configuration. Audit actions are
limited to `create` and `update`. Applying old values across application or schema versions is
outside this feature's scope.
`CONFIGURATION_SAVED_WITHOUT_COMPLETE_HISTORY` explicitly distinguishes a partial persistence
failure from a completed write: the operator must inspect live values before retrying.

## Design

Adobe Files is the durable source of truth for snapshots, archive references, and immutable
audit records. Files replaces the old PR's State-backed persistence. Historical secrets are
redacted rather than retained as encrypted credential backups.
Namespaces, scope codes, and IDs are hashed into path-safe private collection paths.
Record paths form hash partitions that can be listed recursively without losing entries at
the Files client's 1000-result cap. Independent per-scope registration records support global
audit queries without a shared mutable scope index; an empty registration may remain when a
subsequent live write fails.
State remains the existing regional cache for live configuration and is not the audit database.

Prepare and validate redacted records before writing live configuration. After live persistence,
save the version, audit entry, and retention deletions. The existing regional invalidation and
encryption behavior remain unchanged. Operations are not an atomic transaction.

Per-scope version numbering continues from the latest retained version, not the retained count.
`MAX_CONFIG_VERSIONS` defaults to 25 and accepts integers from 1 to 1000. Audit retention is
independent. Snapshots of at least 900 KiB use a separate archive collection plus a primary
reference; the maximum serialized record is 10 MiB. Retention removes archive payloads too.
Archive functions expose maintenance and statistics without changing live configuration.

Diffs preserve values and origins in both directions. Property-based tests check forward and
inverse reconstruction across strings, booleans, multi-select lists, undefined values, and
origin changes. Redaction uses schema password fields and sensitive-name patterns. Actor
metadata is application-supplied and may contain personal data.

Audit records use stable JSON SHA-256 digests including the predecessor hash. Verification
checks content and one connected chain, detects forks and missing interior records, and may
compare an exact head stored outside Files. Missing listed records, malformed JSON, identity
mismatches, invalid archive paths, and storage errors are never treated as empty history.
An empty chain is valid only without a conflicting external checkpoint.

The generated GET/PATCH action remains in place; PATCH forwards the additive version metadata
and keeps its existing password masking and no-store header. Its OpenAPI contract changes
additively. The PR's obsolete, unregistered per-operation runtime templates are not revived;
applications can expose the public APIs through their own authenticated actions.

## Drawbacks

Every write adds storage operations and may fail after configuration has already changed.
Queries and integrity checks scan stored records, so storage work grows with the audit trail
even when response pagination is small. Audit storage is unbounded until an application defines
a maintenance policy. Archiving organizes Files payloads but does not change their storage class.

Callers must serialize same-scope writes across invocations. Immutable record paths avoid lost
index updates but not lost live updates, duplicate sequences, retention races, or forks.
The library detects a broken chain and blocks normal writes; repair remains operational work.

## Rationale and alternatives

- Permanent State entries were rejected: State TTL and independent regional stores do not
  provide the durable, workspace-wide history intended by the feature.
- Encrypted historical credentials were rejected for this port in favor of redacted history.
- Configuration rollback is deferred because restoring old values across application and schema
  versions requires compatibility and migration policies beyond audit inspection.
- Hash chains provide limited tamper evidence without introducing signing/key management.
  A writable unkeyed chain is not tamper-proof; trusted checkpoints must be stored externally.
- A transactional database, WORM store, or external audit service could provide stronger
  guarantees but adds deployment dependencies beyond the SDK's current storage model.

## Unresolved questions

- Maintainers must approve the separate spec and the default automatic recording behavior
  before release; this file is not evidence that the required spec PR has merged.
- Confirm production requirements for serialized writes, partial-write repair, query scale,
  trusted checkpoint ownership, and actor-data retention/deletion.
- Cryptographic verification of snapshot contents, distributed lock/fencing, signatures,
  transactional writes, and high-volume indexed queries remain outside this proposal.

## Future possibilities

Authenticated history UI and runtime routes, bounded indexed scans, application-managed audit
retention with externally anchored checkpoints, and opt-in external append-only audit sinks.
