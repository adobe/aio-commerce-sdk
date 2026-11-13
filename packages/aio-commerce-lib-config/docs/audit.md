# Business configuration audit

`setConfiguration` records changed business configuration fields in Adobe Files. Each audit
record contains the scope, timestamp, supplied actor, and added/modified/removed fields with
their before/after values and origins. Unchanged writes and system configuration are not audited.
No configuration snapshots, version sequences, rollback, archives, or integrity chains are provided.

```typescript
import {
  byCodeAndLevel,
  getAuditLog,
  initialize,
  setConfiguration,
} from "@adobe/aio-commerce-lib-config";

initialize({
  schema: [
    { name: "enabled", type: "boolean", default: false },
    { name: "credential", type: "password", default: "" },
  ],
});

await setConfiguration(
  {
    config: [{ name: "enabled", value: true }],
    metadata: {
      actor: { userId: authenticatedUserId, source: "support-tool" },
    },
  },
  byCodeAndLevel("global", "global"),
);
const { entries, pagination } = await getAuditLog({
  scopeCode: "global",
  userId: authenticatedUserId,
  limit: 50,
});
```

## Sensitive values and attribution

Password fields, values absent from the current schema, and sensitive names such as `api_key`,
`secret`, `credential`, and `token` are replaced with `***REDACTED***` on both sides of each change.
Neither plaintext nor encrypted historical credentials are stored in the audit. Initialize with
the current schema on each invocation; stored encrypted values remain redacted if a field changes
type. Declare all sensitive fields as `password`; the library
cannot identify arbitrary confidential content placed in an ordinary text field.

Only `userId` and `source` are retained from actor metadata, not IP addresses, user agents, tokens,
or request headers. Supply a stable identifier from authenticated server-side context, never a
credential. Actor identifiers may themselves be personal data and require appropriate access
and retention policies. If no actor is provided, the record has an empty actor rather than an
invented identity. The generated PATCH action does not currently supply actor identity; use an
application-owned authenticated action to populate it. Audit querying is a library API, not a
generated HTTP route or UI.

## Queries and persistence

`getAuditLog` is read-only. It accepts a case-insensitive scope **code**, exact `userId`, inclusive
`startDate`/`endDate`, `limit` (1–1000, default 50), and nonnegative `offset` (default 0).
Omit scope to query all scopes. Records are returned newest first with
`pagination: { total, limit, offset, hasMore }`. Invalid filters and corrupt or inaccessible storage
throw rather than returning an apparently empty audit.

Audit records are stored privately in namespace-isolated Adobe Files, not the live State cache.
Queries scan records; pagination bounds output, not storage work. This is intended for low-volume
business settings, not analytics or a tamper-proof compliance ledger. No automatic deletion or
retention management is included.

Audit payloads over 10 MiB reject the write before configuration persistence. Live configuration
and audit records are separate writes: `CONFIGURATION_SAVED_WITHOUT_AUDIT` means live values were
saved but the audit append failed. Inspect live values before retrying. Process crashes can also
leave missing audit records. Applications must serialize writes to a scope to ensure before/after
values reflect the preceding successful write. Audit does not change existing encryption,
inheritance, cache invalidation, or configuration response fields.
