# `StateStoreOptions`

```ts
type StateStoreOptions = {
  keyPrefix?: string;
  ttlSeconds?: number;
};
```

Defined in: [storage/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/storage/types.ts#L57)

Options for creating a lib-state based store.

## Properties

### keyPrefix?

```ts
optional keyPrefix?: string;
```

Defined in: [storage/types.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/storage/types.ts#L59)

Key prefix for all entries.

---

### ttlSeconds?

```ts
optional ttlSeconds?: number;
```

Defined in: [storage/types.ts:61](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/common-utils/source/storage/types.ts#L61)

TTL in seconds for cached entries.
