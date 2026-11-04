# `StateStoreOptions`

```ts
type StateStoreOptions = {
  keyPrefix?: string;
  ttlSeconds?: number;
};
```

Defined in: [storage/types.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L65)

Options for creating a lib-state based store.

## Properties

### keyPrefix?

```ts
keyPrefix?: string;
```

Defined in: [storage/types.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L67)

Key prefix for all entries.

---

### ttlSeconds?

```ts
ttlSeconds?: number;
```

Defined in: [storage/types.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/storage/types.ts#L69)

TTL in seconds for cached entries.
