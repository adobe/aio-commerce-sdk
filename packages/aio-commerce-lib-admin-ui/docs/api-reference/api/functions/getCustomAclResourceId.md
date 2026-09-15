# `getCustomAclResourceId()`

```ts
function getCustomAclResourceId(
  metadataId: string,
  resourceId: string,
  childId?: string,
): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts:84](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts#L84)

Derives the deterministic Commerce ACL resource id for a custom (standalone) ACL resource
declared under `adminUi.acl`. Mirrors the Commerce `AclResourceIdGenerator` `acl` token exactly.

With only `resourceId`, returns the id of a top-level resource or a group node; with `childId`,
returns the id of a leaf inside that group. Each segment is sanitized independently (trim,
lowercase, non-`[a-z0-9_]` → `_`).

## Parameters

| Parameter    | Type     | Description                                                         |
| ------------ | -------- | ------------------------------------------------------------------- |
| `metadataId` | `string` | The application's `metadata.id` value.                              |
| `resourceId` | `string` | The top-level resource or group `id` from `adminUi.acl`.            |
| `childId?`   | `string` | Optional child leaf `id` when addressing a resource inside a group. |

## Returns

`string`

The full Commerce ACL resource id, or an empty string when `metadataId` is blank.

## Example

```
getCustomAclResourceId("my-app", "approve_refunds")
// → "Magento_CommerceBackendUix::adminuisdk_app_my_app_acl_approve_refunds"
getCustomAclResourceId("my-app", "reports", "export")
// → "Magento_CommerceBackendUix::adminuisdk_app_my_app_acl_reports_export"
```
