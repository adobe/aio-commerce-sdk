# Business configuration audit

`setConfiguration` records changed business configuration fields in Adobe Files. Each audit record contains the scope, timestamp, supplied actor, and added/modified/removed fields with their before/after values and origins. Unchanged writes and system configuration are not audited. No configuration snapshots, version sequences, rollback, archives, or integrity chains are provided.

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
const { entries, pagination } = await getAuditLog(
  byCodeAndLevel("global", "global"),
  {
    userId: authenticatedUserId,
    limit: 50,
  },
);
```

## Sensitive values and attribution

Fields declared as `type: "password"` and values absent from the current schema are replaced with `***REDACTED***` on both sides of each change. Field names are not used to infer sensitivity; confidential values must use `type: "password"`, regardless of their name. Neither plaintext nor encrypted historical credentials are stored in the audit. Initialize with the current schema on each invocation; stored encrypted values remain redacted if a field changes type. Declare all sensitive fields as `password`; the library cannot identify arbitrary confidential content placed in an ordinary text field.

Only `userId` and `source` are retained from actor metadata, not IP addresses, user agents, tokens, or request headers. Supply a stable identifier from authenticated server-side context, never a credential. Actor identifiers may themselves be personal data and require appropriate access and retention policies. If no actor is provided, the record has an empty actor rather than an invented identity. Callers are responsible for authenticating the actor and supplying `metadata.actor` when calling `setConfiguration`; this library does not authenticate users.

## Queries and persistence

Each change groups its value and origin under `old: { value, origin }` and `new: { value, origin }`. Added fields omit `old`; removed fields omit `new`.

`getAuditLog(selector?, filters?)` is read-only. Use the same `byScopeId`, `byCodeAndLevel`, `byCode`, `byWebsiteId`, `byStoreId`, and `byStoreViewId` selectors as other configuration helpers. Selectors resolve against the current scope tree and unknown scopes throw. Filters accept exact `userId`, inclusive `startDate`/`endDate`, `limit` (1–1000, default 50), and nonnegative `offset` (default 0). Use `getAuditLog()` for all scopes, or `getAuditLog(undefined, filters)` for a filtered cross-scope query. Records are returned newest first with `pagination: { total, limit, offset, hasMore }`. Invalid filters and corrupt or inaccessible storage throw rather than returning an apparently empty audit.

Audit records are stored privately in namespace-isolated Adobe Files, not the live State cache. Queries scan records; pagination bounds output, not storage work. This is intended for low-volume business settings, not analytics or a tamper-proof compliance ledger. No automatic deletion or retention management is included.

Audit payloads over 10 MiB reject the write before configuration persistence. Live configuration and audit records are separate writes: `CONFIGURATION_SAVED_WITHOUT_AUDIT` means live values were saved but the audit append failed. Inspect live values before retrying. Process crashes can also leave missing audit records. Applications must serialize writes to a scope to ensure before/after values reflect the preceding successful write.
