# `getMassActionAclResourceId()`

```ts
function getMassActionAclResourceId(
  metadataId: string,
  entity: "order" | "product" | "customer",
  actionId: string,
): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/mass-actions/acl-resource-id.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-admin-ui/source/mass-actions/acl-resource-id.ts#L40)

Derives the deterministic Commerce ACL resource id for a mass action.

The id is assembled as: `getAclResourceId(metadataId)` + `"_<entity>_massactions_"` +
sanitized `actionId`. The `entity` value is used verbatim; the `actionId` is sanitized
(trimmed, lowercased, non-`[a-z0-9_]` → `_`). `"Magento_CommerceBackendUix::adminuisdk_app_"`
in the example is the fixed constant prefix (not a placeholder), and `"_massactions_"` is the
literal keyword separator for this component:

## Parameters

| Parameter    | Type                                     | Description                                                              |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| `metadataId` | `string`                                 | The application's `metadata.id` value (e.g. `"approval-dashboard-app"`). |
| `entity`     | `"order"` \| `"product"` \| `"customer"` | The grid's Commerce entity (`"order"`, `"product"`, or `"customer"`).    |
| `actionId`   | `string`                                 | The action's `id` value from `adminUi.<entity>.massActions[].id`.        |

## Returns

`string`

The full Commerce ACL resource id for the mass-action leaf node, or an empty string
when `metadataId` is blank.

## Example

```
getMassActionAclResourceId("approval-dashboard-app", "order", "bulk-approve")
// getAclResourceId("approval-dashboard-app")                          + "_order_massactions_" + sanitize("bulk-approve")
// "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app" + "_order_massactions_" + "bulk_approve"
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_massactions_bulk_approve"
```
