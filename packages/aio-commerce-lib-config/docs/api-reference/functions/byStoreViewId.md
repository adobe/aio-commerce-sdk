# `byStoreViewId()`

```ts
function byStoreViewId(commerceScopeId: number): SelectorByCommerceScopeId;
```

Defined in: [config-utils.ts:807](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-config/source/config-utils.ts#L807)

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
