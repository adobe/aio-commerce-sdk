# `SelectorBy`

```ts
type SelectorBy = SelectorByScopeId | SelectorByCodeAndLevel | SelectorByCode;
```

Defined in: [config-utils.ts:538](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-config/source/config-utils.ts#L538)

Discriminated union type for selecting a scope by different methods.

Use the helper functions [byScopeId](../functions/byScopeId.md), [byCodeAndLevel](../functions/byCodeAndLevel.md), or [byCode](../functions/byCode.md) to create
selector objects instead of constructing them manually.
