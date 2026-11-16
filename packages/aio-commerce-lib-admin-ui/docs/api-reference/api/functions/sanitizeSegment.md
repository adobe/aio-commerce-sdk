# `sanitizeSegment()`

```ts
function sanitizeSegment(segment: string): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts#L30)

Sanitizes a single ACL id segment: trims whitespace, lowercases, and replaces every
character outside [a-z0-9_] with an underscore. This mirrors the Commerce module's own
per-segment normalization — the same step applied when building any ACL resource id from a
config id.

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `segment` | `string` |

## Returns

`string`
