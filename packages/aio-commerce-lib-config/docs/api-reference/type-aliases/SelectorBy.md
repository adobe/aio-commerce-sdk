# `SelectorBy`

```ts
type SelectorBy = SelectorByScopeId | SelectorByCodeAndLevel | SelectorByCode;
```

Defined in: [aio-commerce-lib-config/source/config-utils.ts:536](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-config/source/config-utils.ts#L536)

Discriminated union type for selecting a scope by different methods.

Use the helper functions [byScopeId](../functions/byScopeId.md), [byCodeAndLevel](../functions/byCodeAndLevel.md), or [byCode](../functions/byCode.md) to create
selector objects instead of constructing them manually.
