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

Defined in: [config-utils.ts:660](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-config/source/config-utils.ts#L660)

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

Defined in: [config-utils.ts:661](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-config/source/config-utils.ts#L661)

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
