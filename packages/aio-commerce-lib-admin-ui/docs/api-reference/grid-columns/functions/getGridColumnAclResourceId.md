# `getGridColumnAclResourceId()`

```ts
function getGridColumnAclResourceId(
  metadataId: string,
  entity: AdminUiEntity,
  columnId: string,
): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/acl-resource-id.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/grid-columns/acl-resource-id.ts#L40)

Derives the deterministic Commerce ACL resource id for a grid column.

The id is assembled as: `getAclResourceId(metadataId)` + `"_<entity>_gridcolumns_"` +
sanitized `columnId`. The `entity` value is used verbatim (it is already `[a-z]`); the
`columnId` is sanitized (trimmed, lowercased, non-`[a-z0-9_]` → `_`). `"Magento_CommerceBackendUix::adminuisdk_app_"`
in the example is the fixed constant prefix (not a placeholder), and `"_gridcolumns_"` is the
literal keyword separator for this component:

## Parameters

| Parameter    | Type                                                       | Description                                                               |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `metadataId` | `string`                                                   | The application's `metadata.id` value (e.g. `"approval-dashboard-app"`).  |
| `entity`     | [`AdminUiEntity`](../../api/type-aliases/AdminUiEntity.md) | The grid's Commerce entity (`"order"`, `"product"`, or `"customer"`).     |
| `columnId`   | `string`                                                   | The column's `id` value from `adminUi.<entity>.gridColumns.columns[].id`. |

## Returns

`string`

The full Commerce ACL resource id for the grid-column leaf node, or an empty string
when `metadataId` is blank.

## Example

```
getGridColumnAclResourceId("approval-dashboard-app", "order", "order_status")
// getAclResourceId("approval-dashboard-app")                          + "_order_gridcolumns_" + sanitize("order_status")
// "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app" + "_order_gridcolumns_" + "order_status"
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_gridcolumns_order_status"
```
