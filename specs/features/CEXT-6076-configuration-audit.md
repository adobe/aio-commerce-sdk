# Read-only business configuration audit

- **Ticket:** [CEXT-6076](https://jira.corp.adobe.com/browse/CEXT-6076)
- **Created:** 2026-11-09
- [ ] **Implemented**

## Summary

Record which business configuration fields changed, their non-sensitive before/after values,
the scope, timestamp, and application-supplied actor. Expose one read-only `getAuditLog` API.
This implementation accompanies the proposal; separate spec and release approval remain required.

## Motivation

Operators need to investigate configuration changes and attribute them to application actors
without retaining sensitive values. The previous PR's versioning machinery made review unnecessarily
large. Snapshots, comparisons between snapshots, rollback, archives, retention configuration,
integrity chains, and historical credentials are outside this ticket's scope.

## Developer experience

Pass `metadata: { actor: { userId, source } }` to the existing `setConfiguration` API.
`getAuditLog({ scopeCode, userId, startDate, endDate, limit, offset })` returns changed fields,
newest first, and pagination metadata. Values retain their types and scope-local origins.
Unchanged writes and system configuration do not create audit records. The configuration write
response is unchanged.

## Design

Calculate additions, modifications, and removals using the existing persisted and merged
scope-local overrides. Replace both sides of sensitive changes with `***REDACTED***` before
serializing. Schema password fields, sensitive names, and fields absent from the current schema
are redacted. Only `userId` and `source` are retained from actor metadata.

Prepare and size-check the record before the live write. After live persistence, append the
record privately to Adobe Files under a namespace-isolated, uniquely named path. Queries list
the records, validate them, filter, sort, and paginate. Hash-partitioned paths avoid silently
truncating results at the Files client's 1000-record listing cap. Hashes encode paths only;
there is no audit integrity chain or verification claim.

No snapshot, scope registry, mutable index, version counter, archive, or State-backed audit
database is required. Existing encryption, inheritance, selectors, and cache invalidation remain.

## Drawbacks

Live and audit writes are not atomic. `CONFIGURATION_SAVED_WITHOUT_AUDIT` reports that live values
were saved but audit persistence failed; crashes can also leave gaps. Callers must serialize
same-scope writes for accurate before/after values. Queries scan records and are intended for
low-volume settings. Storage errors and corrupt records fail explicitly.

The application supplies actor identity from trusted authentication; the library cannot
authenticate it. The generated PATCH action does not currently supply that identity. Missing
metadata is represented honestly as an empty actor. User identifiers can be personal data.
Sensitive values in ordinary declared text fields cannot be recognized reliably; applications
must mark confidential fields as passwords. There is no automatic deletion policy or tamper-proof
storage.

## Rationale and alternatives

- Durable Adobe Files avoids State TTL and independent regional audit stores.
- Changed fields only keep the feature focused on attribution rather than configuration recovery.
- No hash chain, shared index, or version sequence is needed for read-only change inspection.
- An external audit service could provide stronger guarantees, at the cost of new dependencies.

## Unresolved questions

Maintainers must approve the spec and operational policies for actor authentication, access,
retention/deletion, query scale, and recovery after partial writes before release.

## Future possibilities

Authenticated runtime/UI integration and external audit sinks can be proposed independently.
