# `SelectorBy`

```ts
type SelectorBy =
  | SelectorByScopeId
  | SelectorByCodeAndLevel
  | SelectorByCode
  | SelectorByCommerceScopeId;
```

Defined in: [config-utils.ts:674](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-config/source/config-utils.ts#L674)

Discriminated union type for selecting a scope by different methods.

Use the helper functions [byScopeId](../functions/byScopeId.md), [byCodeAndLevel](../functions/byCodeAndLevel.md), [byCode](../functions/byCode.md),
[byWebsiteId](../functions/byWebsiteId.md), [byStoreId](../functions/byStoreId.md), or [byStoreViewId](../functions/byStoreViewId.md) to create
selector objects instead of constructing them manually.
