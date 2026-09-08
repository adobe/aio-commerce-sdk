# `getAclResourceId()`

```ts
function getAclResourceId(metadataId: string): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-admin-ui/source/api/lib/acl-resource-id.ts#L56)

Derives the deterministic Commerce ACL resource id for an app from its metadata id.

The id is assembled as PREFIX + sanitized `metadataId`, where sanitization trims
whitespace, lowercases, and replaces every character outside `[a-z0-9_]` with `_`.
`"Magento_CommerceBackendUix::adminuisdk_app_"` is that fixed constant prefix — not a
placeholder — so the example below is fully reproducible from the given argument:

## Parameters

| Parameter    | Type     | Description                                                              |
| ------------ | -------- | ------------------------------------------------------------------------ |
| `metadataId` | `string` | The application's `metadata.id` value (e.g. `"approval-dashboard-app"`). |

## Returns

`string`

The full Commerce ACL resource id, or an empty string when `metadataId` is blank.

## Example

```
getAclResourceId("approval-dashboard-app")
// PREFIX                                    + sanitize("approval-dashboard-app")
// "Magento_CommerceBackendUix::adminuisdk_app_" + "approval_dashboard_app"
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app"
```
