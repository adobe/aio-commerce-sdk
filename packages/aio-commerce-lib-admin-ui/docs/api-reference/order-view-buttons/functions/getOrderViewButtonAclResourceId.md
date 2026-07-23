# `getOrderViewButtonAclResourceId()`

```ts
function getOrderViewButtonAclResourceId(
  metadataId: string,
  buttonId: string,
): string;
```

Defined in: [aio-commerce-lib-admin-ui/source/order-view-buttons/acl-resource-id.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/order-view-buttons/acl-resource-id.ts#L37)

Derives the deterministic Commerce ACL resource id for an order view button.

View buttons exist only on the order entity, so no entity discriminator is needed.
The id is assembled as: `getAclResourceId(metadataId)` + `"_order_viewbuttons_"` +
sanitized `buttonId`. The `buttonId` is sanitized (trimmed, lowercased, non-`[a-z0-9_]` → `_`).
`"Magento_CommerceBackendUix::adminuisdk_app_"` in the example is the fixed constant prefix
(not a placeholder), and `"_order_viewbuttons_"` is the literal keyword separator for this component:

## Parameters

| Parameter    | Type     | Description                                                              |
| ------------ | -------- | ------------------------------------------------------------------------ |
| `metadataId` | `string` | The application's `metadata.id` value (e.g. `"approval-dashboard-app"`). |
| `buttonId`   | `string` | The button's `id` value from `adminUi.order.viewButtons[].id`.           |

## Returns

`string`

The full Commerce ACL resource id for the view-button leaf node, or an empty string
when `metadataId` is blank.

## Example

```
getOrderViewButtonAclResourceId("approval-dashboard-app", "approve-order")
// getAclResourceId("approval-dashboard-app")                          + "_order_viewbuttons_" + sanitize("approve-order")
// "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app" + "_order_viewbuttons_" + "approve_order"
// → "Magento_CommerceBackendUix::adminuisdk_app_approval_dashboard_app_order_viewbuttons_approve_order"
```
