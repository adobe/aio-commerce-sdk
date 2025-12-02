# `CommerceScopeData`

```ts
type CommerceScopeData = {
  storeGroups: StoreGroup[];
  storeViews: StoreView[];
  websites: Website[];
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/commerce.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/commerce.ts#L19)

Commerce API response data containing websites, store groups, and store views.

This type represents the structure of scope data returned from the Adobe Commerce API
when fetching scope information.

## Properties

### storeGroups

```ts
storeGroups: StoreGroup[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/commerce.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/commerce.ts#L23)

Array of store group definitions.

---

### storeViews

```ts
storeViews: StoreView[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/commerce.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/commerce.ts#L25)

Array of store view definitions.

---

### websites

```ts
websites: Website[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/commerce.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/commerce.ts#L21)

Array of website definitions.
