# `SelectorBy`

```ts
type SelectorBy =
  | SelectorByScopeId
  | SelectorByCodeAndLevel
  | SelectorByCode
  | SelectorByCommerceScopeId;
```

Defined in: [config-utils.ts:675](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-config/source/config-utils.ts#L675)

Discriminated union type for selecting a scope by different methods.

Use the helper functions [byScopeId](../functions/byScopeId.md), [byCodeAndLevel](../functions/byCodeAndLevel.md), [byCode](../functions/byCode.md),
[byWebsiteId](../functions/byWebsiteId.md), [byStoreId](../functions/byStoreId.md), or [byStoreViewId](../functions/byStoreViewId.md) to create
selector objects instead of constructing them manually.
