# `StateStoreOptions`

```ts
type StateStoreOptions = {
  keyPrefix?: string;
  ttlSeconds?: number;
};
```

Defined in: [storage/types.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L65)

Options for creating a lib-state based store.

## Properties

### keyPrefix?

```ts
keyPrefix?: string;
```

Defined in: [storage/types.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L67)

Key prefix for all entries.

---

### ttlSeconds?

```ts
ttlSeconds?: number;
```

Defined in: [storage/types.ts:69](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/storage/types.ts#L69)

TTL in seconds for cached entries.
