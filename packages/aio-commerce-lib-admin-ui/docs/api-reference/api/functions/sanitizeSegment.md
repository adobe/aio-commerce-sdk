# `sanitizeSegment()`

```ts
function sanitizeSegment(segment: string): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts#L30)

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
