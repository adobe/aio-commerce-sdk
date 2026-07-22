# `byStoreViewId()`

```ts
function byStoreViewId(commerceScopeId: number): SelectorByCommerceScopeId;
```

Defined in: [config-utils.ts:813](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-config/source/config-utils.ts#L813)

Creates a scope selector that identifies a store view by its Commerce API ID.

Store views are returned by the Commerce REST endpoint `/V1/store/storeViews`.
The numeric ID is matched against the `commerce_id` of store_view-level scopes.

## Parameters

| Parameter         | Type     | Description                                    |
| ----------------- | -------- | ---------------------------------------------- |
| `commerceScopeId` | `number` | The Commerce API numeric ID of the store view. |

## Returns

[`SelectorByCommerceScopeId`](../type-aliases/SelectorByCommerceScopeId.md)

A selector that identifies the store view scope.

## Example

```typescript
import {
  getConfiguration,
  byStoreViewId,
} from "@adobe/aio-commerce-lib-config";

const config = await getConfiguration(byStoreViewId(2));
```
