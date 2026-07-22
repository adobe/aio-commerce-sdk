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

Defined in: [config-utils.ts:659](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-config/source/config-utils.ts#L659)

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

Defined in: [config-utils.ts:660](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-config/source/config-utils.ts#L660)

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
