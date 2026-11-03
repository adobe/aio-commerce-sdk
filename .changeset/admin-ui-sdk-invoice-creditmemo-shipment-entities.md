---
"@adobe/aio-commerce-lib-admin-ui": minor
---

Add `invoice`, `creditmemo`, and `shipment` grid types to the grid column wire contract, so runtime action handlers and `getGridColumnAclResourceId` can target those grids in addition to order, product, and customer. Export a `MassActionEntity` type that reflects the entities mass actions actually support (order, product, customer); `getMassActionAclResourceId` now accepts it instead of the wider grid entity type.
