# Versioning and audit

Configuration writes record scope-local snapshots and linked audit records in Adobe Files.
For example, a support operator can inspect which configuration changed before a storefront
integration stopped working, compare the affected versions, and restore an earlier non-sensitive
configuration without rotating or overwriting its current credentials.

This is configuration history for low-volume application settings, not a transactional ledger
or a compliance certification. Queries and verification scan stored records; pagination limits
the response size, not the amount of storage scanned.

## Recording and querying changes

Initialize the library with the current schema, including password fields, on every action invocation.
For dynamic schemas use `await initialize({ schema, params })`.

```typescript
import {
  byCodeAndLevel,
  compareVersions,
  getAuditLog,
  getConfigurationHistory,
  getVersionById,
  getVersionComparison,
  initialize,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";

initialize({
  schema: [
    { name: "enabled", type: "boolean", default: false },
    { name: "credential", type: "password", default: "" },
  ],
});

const updated = await setConfiguration(
  {
    config: [{ name: "enabled", value: true }],
    metadata: { actor: { userId: "operator-123", source: "support-tool" } },
  },
  byCodeAndLevel("global", "global"),
);
const versionId = updated.versionInfo?.versionId;
if (versionId) {
  const snapshot = await getVersionById("global", versionId);
  const comparison = await getVersionComparison("global", versionId);
}

const { versions, pagination } = await getConfigurationHistory("global", {
  limit: 10,
  offset: 0,
});
if (versions.length >= 2) {
  const comparison = await compareVersions(
    "global",
    versions[1].id,
    versions[0].id,
  );
}
const audit = await getAuditLog({
  scopeCode: "global",
  userId: "operator-123",
  action: "update",
  startDate: "2026-01-01T00:00:00Z",
  endDate: "2026-12-31T23:59:59Z",
});
```

History functions accept a **scope code**, not a selector, scope ID, or Commerce numeric ID.
Codes are case-insensitive for storage lookup. Snapshots contain explicit overrides only:
they do not freeze inherited parent values or defaults. Boolean and multi-select values retain
their types. Before/after comparisons retain field origins, including removed overrides.

History defaults to 25 results and audit queries to 50. Both accept a limit from 1 to 1000 and a
non-negative integer offset, and return `pagination: { total, limit, offset, hasMore }`.
Omitting `scopeCode` from `getAuditLog` queries all scopes. Date filters are inclusive and
compared as parsed instants, including timezone offsets. Invalid dates, reversed ranges,
and invalid pagination throw. Missing or pruned versions return `null` from lookup/comparison.

Existing configuration is not backfilled. The first subsequent write captures its current
scope-local changes. SDK system configuration writes do not create business configuration history.
An empty or unchanged successful write still records an operation.

## Redaction and actor metadata

Schema-declared `password` fields and sensitive names such as `api_key`, `access_token`,
`secret`, and `credential` are stored as `***REDACTED***` in snapshots and both sides of diffs.
Password fields with innocuous names are redacted using the schema, not just name matching.
Use password schema fields for secrets; ordinary text fields are not a general-purpose
personal-data detection mechanism.

Actor metadata accepts `userId`, `source`, `ipAddress`, and `userAgent`. Audit records keep
all supplied fields; version snapshots keep only `userId` and `source`. Applications must derive
actor data from a trusted, authenticated context rather than trusting client-supplied identity.
Actor metadata can contain personal information: collect only necessary data and define your
own access, retention, and deletion policies. Redaction alone does not establish regulatory compliance.

## Rollback

```typescript
import { rollbackConfiguration } from "@adobe/aio-commerce-lib-config";

await rollbackConfiguration("global", retainedVersionId, {
  actor: { userId: "operator-123", source: "support-tool" },
});
```

Rollback restores the target's non-sensitive local overrides and unsets non-sensitive overrides
that were added later, restoring inheritance. It creates a new version with action `rollback`;
it never rewinds the sequence or deletes the intervening audit trail.

Current secrets are preserved, including secrets created after the target version. Redaction
markers are never written back into live configuration. Consequently, this is **not** a
full credential rollback. Removed or changed scope identities are rejected, and an unavailable
version throws `VERSION_NOT_FOUND`. Cache/encryption options can be passed as the fourth argument.
All existing scope types are supported, including global, website, and store view.

## Integrity verification

```typescript
import { verifyAuditChain } from "@adobe/aio-commerce-lib-config";

const result = await verifyAuditChain("global");
if (!result.valid) {
  throw new Error(result.reason);
}
// Store result.headHash outside this history store as an exact checkpoint.
const verified = await verifyAuditChain("global", trustedHeadHash);
```

Each audit entry contains a SHA-256 digest of its canonical JSON content, including its
predecessor hash. Verification checks record hashes and a single connected chain, independently
of timestamps and file listing order. Changed records, missing interior records, disconnected
chains, duplicate roots, and concurrent-write forks are rejected. Storage failures and invalid
JSON or record shapes throw instead of being treated as an empty or valid trail.

This is **tamper-evident under a trusted checkpoint**, not tamper-proof storage. An attacker
with write access can recompute an entire unkeyed chain or delete its suffix. An exact head
hash previously stored elsewhere detects a rewritten or shortened chain, but also stops matching
after legitimate new writes; checkpoint lifecycle belongs to the application. An empty chain
is valid without a checkpoint. Verification does not authenticate actor identities or prove the
contents of version snapshots, and no WORM storage or digital signatures are provided.

## Retention and archives

Set `MAX_CONFIG_VERSIONS` on every action that writes configuration to choose how many versions
to retain per scope. The default is 25; valid values are integers from 1 to 1000. Invalid values
throw before writing configuration. Version numbers continue increasing after old snapshots
are removed, provided writes to that scope are serialized. Audit records are not automatically
pruned when versions expire, so an audit entry may reference a version no longer retained.

Snapshots of at least 900 KiB of serialized UTF-8 JSON are automatically placed in a separate
Files archive collection with a lightweight primary reference. Records over 10 MiB are rejected
before the live configuration write. Retention deletes both the primary record and its archived
payload. All history paths isolate namespaces and encode scope codes/IDs without permitting path
traversal. Neither snapshots nor references depend on State TTL.
History collections are partitioned so the Files client's 1000-result listing cap does not
silently truncate queries or integrity checks. Independent scope registration records support
workspace-wide audit queries without a shared read-modify-write scope index.

Archive utilities are also exported for explicit maintenance:

```typescript
import {
  archiveOldVersions,
  getStorageStats,
  restoreFromArchive,
  shouldArchive,
} from "@adobe/aio-commerce-lib-config";

const namespace = "aio-commerce-config";
const count = await archiveOldVersions(namespace, "global", retainedVersionIds);
const stats = await getStorageStats(namespace, "global", retainedVersionIds);
const snapshot = await restoreFromArchive(
  namespace,
  "global",
  retainedVersionId,
);
```

`shouldArchive(version, maxAgeDays)` checks the size threshold and age (default 90 days).
`archiveVersion({ namespace, scopeCode, version, reason? })` archives a supplied snapshot.
`archiveOldVersions` skips already archived and absent records, deduplicates IDs, and throws on
storage failures. Archiving organizes payloads within Files; it does not change storage class,
remove them from retention, or provide a compressed backup. `restoreFromArchive` reads active
or archived snapshots and does **not** change live configuration. Statistics count only existing,
distinct records and measure logical snapshot bytes, excluding reference overhead.

`getValueSize` measures serialized JSON in UTF-8 bytes; `isWithinStateSizeLimit` checks the
1 MiB State value boundary for advanced consumers. Unsupported or circular JSON values throw,
rather than returning a success-shaped size. `StorageLimitExceededError` identifies oversized
history records. Configuration history itself does not use State for persistence.

## Consistency and runtime integration

Live configuration, snapshots, audit records, and retention are separate storage operations.
After live configuration persistence succeeds, a history or retention failure throws
`CONFIGURATION_SAVED_WITHOUT_COMPLETE_HISTORY`. The live values may already have changed;
inspect them and repair incomplete history rather than blindly retrying. These operations
cannot roll each other back atomically, and a process crash can leave incomplete records.

Callers must serialize writes to the same scope across runtime invocations. Immutable audit
record names avoid lost index updates, but do not prevent competing configuration writes,
duplicate version numbers, retention races, or audit forks. A broken chain blocks further
normal writes until an operator investigates it. This library supplies no distributed lock
or automatic repair mechanism.

The generated configuration action continues to expose its existing GET/PATCH routes.
PATCH responses include `versionInfo`; passwords remain masked and mutation responses use
`Cache-Control: no-store`. No history, audit, archive, or rollback HTTP routes or Admin UI
are installed automatically. Expose library APIs only through application-owned authenticated
actions with appropriate authorization and no-store response headers. Existing SDK runtime
actions do not populate actor metadata automatically.
