# `GridTypeSchema`

```ts
const GridTypeSchema: PicklistSchema<
  readonly [
    "order",
    "product",
    "customer",
    "invoice",
    "creditmemo",
    "shipment",
    "newsletter",
  ],
  undefined
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/grid-columns/requests/schema.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-admin-ui/source/grid-columns/requests/schema.ts#L26)

Grid identifier sent by Commerce on the `commerce/backend-ui/2` wire contract.

Credit memo grids send `"creditmemo"` — not `"creditMemo"` — even though the corresponding
config key (`adminUi.creditMemo`) is camelCase; see the Commerce module's `CustomColumn::GRID_MAP`.

## See

[Magento module reference](https://github.com/magento-commerce/adobe-commerce-backend-uix)
