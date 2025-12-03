# `SelectorBy`

```ts
type SelectorBy = SelectorByScopeId | SelectorByCodeAndLevel | SelectorByCode;
```

Defined in: [packages/aio-commerce-lib-config/source/config-utils.ts:536](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/config-utils.ts#L536)

Discriminated union type for selecting a scope by different methods.

Use the helper functions [byScopeId](../functions/byScopeId.md), [byCodeAndLevel](../functions/byCodeAndLevel.md), or [byCode](../functions/byCode.md) to create
selector objects instead of constructing them manually.
