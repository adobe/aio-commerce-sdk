---
title: "SelectorBy"
editUrl: false
prev: false
next: false
---

```ts
type SelectorBy = SelectorByScopeId | SelectorByCodeAndLevel | SelectorByCode;
```

Defined in: [config-utils.ts:552](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-config/source/config-utils.ts#L552)

Discriminated union type for selecting a scope by different methods.

Use the helper functions [byScopeId](../functions/byScopeId.md), [byCodeAndLevel](../functions/byCodeAndLevel.md), or [byCode](../functions/byCode.md) to create
selector objects instead of constructing them manually.
