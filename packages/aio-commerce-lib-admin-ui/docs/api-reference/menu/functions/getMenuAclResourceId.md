# `getMenuAclResourceId()`

```ts
function getMenuAclResourceId(metadataId: string, menuId: string): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/menu/acl-resource-id.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/menu/acl-resource-id.ts#L36)

Derives the deterministic Commerce ACL resource id for a specific menu item.

The id is assembled as: `getAclResourceId(metadataId)` + `"_menu_"` + sanitized `menuId`.
Each segment is sanitized independently (trimmed, lowercased, non-`[a-z0-9_]` → `_`).
`"Magento_CommerceBackendUix::adminuisdk_app_"` in the example is the fixed constant prefix
(not a placeholder), and `"_menu_"` is the literal keyword separator for this component:

## Parameters

| Parameter    | Type     | Description                                                                      |
| ------------ | -------- | -------------------------------------------------------------------------------- |
| `metadataId` | `string` | The application's `metadata.id` value (e.g. `"approval-dashboard-app"`).         |
| `menuId`     | `string` | The menu item's `id` value from `adminUi.menu.id` (e.g. `"approval_dashboard"`). |

## Returns

`string`

The full Commerce ACL resource id for the menu leaf node, or an empty string
when `metadataId` is blank.

## Example

```
getMenuAclResourceId("approval-dashboard-app", "approval_dashboard")
// getAclResourceId("approval-dashboard-app")                          + "_menu_" + sanitize("approval_dashboard")
// "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app" + "_menu_" + "approval_dashboard"
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_menu_approval_dashboard"
```
