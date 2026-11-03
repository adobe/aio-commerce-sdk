# `byStoreId()`

```ts
function byStoreId(commerceScopeId: number): SelectorByCommerceScopeId;
```

Defined in: [config-utils.ts:794](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-config/source/config-utils.ts#L794)

Creates a scope selector that identifies a store (store group) by its Commerce API ID.

Store groups are returned by the Commerce REST endpoint `/V1/store/storeGroups`.
In the scope tree they live at the `"store"` level. The numeric ID is matched
against the `commerce_id` of store-level scopes.

## Parameters

| Parameter         | Type     | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `commerceScopeId` | `number` | The Commerce API numeric ID of the store group. |

## Returns

[`SelectorByCommerceScopeId`](../type-aliases/SelectorByCommerceScopeId.md)

A selector that identifies the store scope.

## Example

```typescript
import { getConfiguration, byStoreId } from "@adobe/aio-commerce-lib-config";

const config = await getConfiguration(byStoreId(1));
```
