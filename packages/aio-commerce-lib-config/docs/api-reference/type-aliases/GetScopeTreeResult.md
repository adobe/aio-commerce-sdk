# `GetScopeTreeResult`

```ts
type GetScopeTreeResult = {
  fallbackError?: string;
  isCachedData: boolean;
  scopeTree: ScopeNode[];
};
```

Defined in: [aio-commerce-lib-config/source/modules/scope-tree/types.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L55)

Result from getting the scope tree.

## Properties

### fallbackError?

```ts
optional fallbackError: string;
```

Defined in: [aio-commerce-lib-config/source/modules/scope-tree/types.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L61)

Optional error message if fallback data was used.

---

### isCachedData

```ts
isCachedData: boolean;
```

Defined in: [aio-commerce-lib-config/source/modules/scope-tree/types.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L59)

Whether the returned data came from cache.

---

### scopeTree

```ts
scopeTree: ScopeNode[];
```

Defined in: [aio-commerce-lib-config/source/modules/scope-tree/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L57)

The scope tree as an array of root scope nodes.
