# `SelectorByCommerceScopeId`

```ts
type SelectorByCommerceScopeId = {
  by: {
    _tag: "commerceScopeId";
    commerceScopeId: number;
    level: "website" | "store" | "store_view";
  };
};
```

Defined in: [config-utils.ts:653](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-config/source/config-utils.ts#L653)

Selector type for identifying a system scope by its Commerce API ID.

`commerce_id` values are unique only within a single level (a website and a
store can both have id=1), so the level is encoded by the factory used:
[byWebsiteId](../functions/byWebsiteId.md), [byStoreId](../functions/byStoreId.md), or [byStoreViewId](../functions/byStoreViewId.md).

## Properties

### by

```ts
by: {
  _tag: "commerceScopeId";
  commerceScopeId: number;
  level: "website" | "store" | "store_view";
}
```

Defined in: [config-utils.ts:654](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-config/source/config-utils.ts#L654)

#### \_tag

```ts
_tag: "commerceScopeId";
```

#### commerceScopeId

```ts
commerceScopeId: number;
```

#### level

```ts
level: "website" | "store" | "store_view";
```
