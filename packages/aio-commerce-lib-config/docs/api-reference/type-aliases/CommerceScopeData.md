# `CommerceScopeData`

```ts
type CommerceScopeData = {
  storeGroups: StoreGroup[];
  storeViews: StoreView[];
  websites: Website[];
};
```

Defined in: [types/commerce.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-config/source/types/commerce.ts#L19)

Commerce API response data containing websites, store groups, and store views.

This type represents the structure of scope data returned from the Adobe Commerce API
when fetching scope information.

## Properties

### storeGroups

```ts
storeGroups: StoreGroup[];
```

Defined in: [types/commerce.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-config/source/types/commerce.ts#L23)

Array of store group definitions.

---

### storeViews

```ts
storeViews: StoreView[];
```

Defined in: [types/commerce.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-config/source/types/commerce.ts#L25)

Array of store view definitions.

---

### websites

```ts
websites: Website[];
```

Defined in: [types/commerce.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-config/source/types/commerce.ts#L21)

Array of website definitions.
